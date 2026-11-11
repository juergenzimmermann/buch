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

import { addFile, findFileByBuchId } from '../service/buch-file-service.mts';
import { badRequest, createProblemDetails } from '../../problem-details.mts';
import { Hono } from 'hono';
import { createBaseUrl } from './create-base-url.mts';
import { getLogger } from '../../logger/logger.mts';
import { rolesRequired } from '../../security/roles-required.mts';

/**
 * Router für die Verwaltung von Bücher.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const router = new Hono();

const logger = getLogger('buch-file-router');
const MAX_FILE_SIZE_BYTES = 10_485_760;

// =============================================================================
// D o w n l o a d
// =============================================================================
router.get('/file/:id', async (c) => {
    const id = c.req.param('id');
    logger.debug('download: id=%s', id);
    const idNumber = Number.parseInt(id, 10);
    if (Number.isNaN(idNumber)) {
        return c.notFound();
    }

    const buchFile = await findFileByBuchId(idNumber);
    if (buchFile === undefined) {
        return c.notFound();
    }

    return c.body(buchFile.data as Uint8Array<ArrayBuffer>, {
        headers: { 'Content-Type': buchFile.mimetype ?? '' },
    });
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
