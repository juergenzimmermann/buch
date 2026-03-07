// Copyright (C) 2026 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

/**
 * Das Modul besteht aus Router für die Verwaltung von Bücher.
 * @packageDocumentation
 */

import { Hono } from 'hono';
import { File } from 'node:buffer';
import { container } from '../../container.mts';
import { getLogger } from '../../logger/logger.mts';
import {
    badRequest,
    createProblemDetails,
    preconditionRequired,
} from '../../problem-details.mts';
import { roleRequired } from '../../security/role-required.mts';
import {
    type BuchCreate,
    type BuchFileCreated,
    type BuchUpdate,
} from '../service/buch-write-service.mts';
import {
    BuchNeuSchema,
    BuchUpdateSchema,
    type BuchNeuType,
    type BuchUpdateType,
} from './buch-validation.mts';
import { createBaseUrl } from './create-base-url.mts';

const { buchWriteService } = container;

/**
 * Router für die Verwaltung von Bücher.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const router = new Hono();

const logger = getLogger('buch-write-router', 'file');

// -----------------------------------------------------------------------------
// N e u a n l e g e n
// -----------------------------------------------------------------------------
router.post('/', roleRequired('admin', 'user'), async (c) => {
    const json = await c.req.json();

    // Validierung mit Zod: ZodError wird geworfen, falls Validierung nicht erfolgreich
    const buchDTO: BuchNeuType = BuchNeuSchema.parse(json);
    logger.debug('post: buchDTO=%o', buchDTO);

    const buch = buchDtoToBuchCreateInput(buchDTO);
    const id = await buchWriteService.create(buch);

    const location = `${createBaseUrl(c.req)}/${id}`;
    const { header, body } = c;
    header('Location', location);
    return body(null, 201);
});

const buchDtoToBuchCreateInput = (buchDTO: BuchNeuType): BuchCreate => {
    const abbildungen = buchDTO.abbildungen?.map((abbildungDTO) => {
        const abbildung = {
            beschriftung: abbildungDTO.beschriftung,
            contentType: abbildungDTO.contentType,
        };
        return abbildung;
    });
    const buch: BuchCreate = {
        version: 0,
        isbn: buchDTO.isbn,
        rating: buchDTO.rating,
        art: buchDTO.art ?? null,
        preis: buchDTO.preis,
        rabatt: buchDTO.rabatt ?? 0,
        lieferbar: buchDTO.lieferbar ?? false,
        datum: buchDTO.datum ?? null,
        homepage: buchDTO.homepage ?? null,
        schlagwoerter: buchDTO.schlagwoerter ?? [],
        titel: {
            create: {
                titel: buchDTO.titel.titel,
                untertitel: buchDTO.titel.untertitel ?? null,
            },
        },
        abbildungen: { create: abbildungen ?? [] },
    };
    return buch;
};

// -----------------------------------------------------------------------------
// A e n d e r n
// -----------------------------------------------------------------------------
router.put('/:id', roleRequired('admin', 'user'), async (c) => {
    const { req } = c;
    const id = req.param('id') ?? '-1';
    logger.debug('put: id=%s', id);
    const idNumber = Number.parseInt(id, 10);
    if (Number.isNaN(idNumber)) {
        // https://hono.dev/docs/api/context#notfound
        return c.notFound();
    }

    // https://hono.dev/docs/api/request#header
    const version = req.header('If-Match');
    if (version === undefined) {
        logger.debug('put: version === undefined');
        return createProblemDetails(
            c,
            preconditionRequired,
            'Header "If-Match" fehlt',
        );
    }

    const json = await c.req.json();

    // Validierung mit Zod
    const buchDTO: BuchUpdateType = BuchUpdateSchema.parse(json);
    logger.debug('put: buchDTO=%o', buchDTO);

    const buch = buchDtoToBuchUpdate(buchDTO);
    const neueVersion = await buchWriteService.update({
        id: idNumber,
        buch,
        version,
    });
    logger.debug('put: neueVersion=%d', neueVersion);
    const headers = {
        ETag: `"${neueVersion}"`,
    };
    return c.body(null, 204, headers);
});

const buchDtoToBuchUpdate = (buchDTO: BuchUpdateType): BuchUpdate => {
    return {
        version: 0,
        isbn: buchDTO.isbn,
        rating: buchDTO.rating,
        art: buchDTO.art ?? null,
        preis: buchDTO.preis,
        rabatt: buchDTO.rabatt ?? 0,
        lieferbar: buchDTO.lieferbar ?? false,
        datum: buchDTO.datum ?? null,
        homepage: buchDTO.homepage ?? null,
        schlagwoerter: buchDTO.schlagwoerter ?? [],
    };
};

// -----------------------------------------------------------------------------
// L o e s c h e n
// -----------------------------------------------------------------------------
router.delete('/:id', roleRequired('admin'), async (c) => {
    const id = c.req.param('id') ?? '-1';
    logger.debug('delete: id=%s', id);
    const idNumber = Number.parseInt(id, 10);
    const { body } = c;
    if (Number.isNaN(idNumber)) {
        return body(null, 204);
    }

    await buchWriteService.delete(idNumber);
    return body(null, 204);
});

// -----------------------------------------------------------------------------
// F i l e   U p l o a d
// -----------------------------------------------------------------------------
router.post('/:id', roleRequired('admin', 'user'), async (c) => {
    const id = c.req.param('id') ?? '-1';
    logger.debug('upload: id=%s', id);
    const idNumber = Number.parseInt(id, 10);
    if (Number.isNaN(idNumber)) {
        return c.notFound();
    }

    const contentType = c.req.header('Content-Type');
    logger.debug('upload: contentType=%s', contentType);

    // https://hono.dev/examples/file-upload
    // https://dev.to/aaronksaunders/quick-rest-api-file-upload-with-hono-js-and-drizzle-49ok
    const body = await c.req.parseBody();
    const file = body['file'];
    if (file === undefined || (Array.isArray(file) && file.length !== 1)) {
        return createProblemDetails(
            c,
            badRequest,
            'Keine oder mehrere Dateien hochgeladen',
        );
    }
    if (!(file instanceof File)) {
        return createProblemDetails(
            c,
            badRequest,
            `Ungueltiger Typ beim Upload: ${typeof file}`,
        );
    }

    const { name, size, type } = file;
    logger.debug('upload: name=%s, size=%d, type=%s', name, size, type);
    const buffer = Buffer.from(await file.arrayBuffer());
    const buchFile: BuchFileCreated | undefined =
        await buchWriteService.addFile(idNumber, buffer, name, size, type);
    logger.debug(
        'upload: id=%s, byteLength=%s, filename=%s, mimetype=%s',
        buchFile?.id,
        buchFile?.data.byteLength,
        buchFile?.filename,
        buchFile?.mimetype,
    );

    const location = `${createBaseUrl(c.req)}/file/${id}`;
    c.header('Location', location);
    return c.body(null, 204);
});
