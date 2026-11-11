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

import {
    BuchNeuSchema,
    type BuchNeuType,
    BuchUpdateSchema,
    type BuchUpdateType,
} from '../validation/buch-validation.mts';
import {
    badRequest,
    createProblemDetails,
    preconditionFailed,
    preconditionRequired,
} from '../../problem-details.mts';
import { deleteFn, insert, update } from '../service/buch-write-service.mts';
import { Hono } from 'hono';
import { addFile } from '../service/buch-file-service.mts';
import { createBaseUrl } from './create-base-url.mts';
import { getLogger } from '../../logger/logger.mts';
import { rolesRequired } from '../../security/roles-required.mts';

/**
 * Router für die Verwaltung von Bücher.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const router = new Hono();

const logger = getLogger('buch-write-router');
const MAX_FILE_SIZE_BYTES = 10_485_760;

// =============================================================================
// N e u a n l e g e n
// =============================================================================
router.post('/', rolesRequired('admin', 'user'), async (c) => {
    let requestBody: unknown;
    try {
        requestBody = await c.req.json();
    } catch {
        return createProblemDetails(c, badRequest, 'Ungueltiges JSON');
    }

    // Validierung mit Zod: ZodError wird geworfen, falls Validierung nicht erfolgreich
    const buchNeu: BuchNeuType = BuchNeuSchema.parse(requestBody);
    logger.debug('post: buchNeu=%o', buchNeu);

    const id = await insert(buchNeu);

    const location = `${createBaseUrl(c.req)}/${id}`;
    const { header, body } = c;
    header('Location', location);
    return body(null, 201);
});

// =============================================================================
// A e n d e r n
// =============================================================================
router.put('/:id', rolesRequired('admin', 'user'), async (c) => {
    const { req } = c;
    const id = req.param('id') ?? '-1';
    logger.debug('put: id=%s', id);
    const idNumber = Number.parseInt(id, 10);
    if (Number.isNaN(idNumber)) {
        // https://hono.dev/docs/api/context#notfound
        return c.notFound();
    }

    // https://hono.dev/docs/api/request#header
    const ifMatch = req.header('If-Match');
    logger.debug('put: version=%s', ifMatch);
    if (ifMatch === undefined) {
        logger.debug('put: version === undefined');
        return createProblemDetails(c, preconditionRequired, 'Header "If-Match" fehlt');
    }
    const version = Number.parseInt(ifMatch.slice(1, -1), 10);
    if (Number.isNaN(version)) {
        logger.debug('put: version === undefined');
        return createProblemDetails(c, preconditionFailed, 'Header "If-Match" fehlt');
    }

    // Validierung mit Zod
    let requestBody: unknown;
    try {
        requestBody = await c.req.json();
    } catch {
        return createProblemDetails(c, badRequest, 'Ungueltiges JSON');
    }
    const buchUpdate: BuchUpdateType = BuchUpdateSchema.parse(requestBody);
    logger.debug('put: buchUpdate=%o', buchUpdate);

    const neueVersion = await update(idNumber, buchUpdate, version);
    logger.debug('put: neueVersion=%d', neueVersion);
    const headers = {
        ETag: `"${neueVersion}"`,
    };
    return c.body(null, 204, headers);
});

// =============================================================================
// L o e s c h e n
// =============================================================================
router.delete('/:id', rolesRequired('admin'), async (c) => {
    const id = c.req.param('id') ?? '-1';
    logger.debug('delete: id=%s', id);
    const idNumber = Number.parseInt(id, 10);
    const { body } = c;
    if (Number.isNaN(idNumber)) {
        return body(null, 204);
    }

    await deleteFn(idNumber);
    return body(null, 204);
});

// =============================================================================
// F i l e   U p l o a d
// =============================================================================
router.post('/:id', rolesRequired('admin', 'user'), async (c) => {
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
    const { file } = body;
    if (file === undefined) {
        return createProblemDetails(c, badRequest, 'Keine Dateien hochgeladen');
    }
    if (Array.isArray(file) && file.length !== 1) {
        return createProblemDetails(c, badRequest, 'Mehrere Dateien hochgeladen');
    }
    if (!(file instanceof File)) {
        return createProblemDetails(c, badRequest, `Ungueltiger Typ beim Upload: ${typeof file}`);
    }

    const { name, size, type } = file;
    logger.debug('upload: name=%s, size=%d, type=%s', name, size, type);
    if (size > MAX_FILE_SIZE_BYTES) {
        return createProblemDetails(c, badRequest, `Datei mit ${size} Bytes`);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = await addFile(idNumber, buffer, size, name, type);
    logger.debug('upload: fileId=%d', fileId);

    const location = `${createBaseUrl(c.req)}/file/${id}`;
    c.header('Location', location);
    return c.body(null, 204);
});
