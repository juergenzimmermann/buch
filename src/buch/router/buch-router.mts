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
import { container } from '../../container.mts';
import { getLogger } from '../../logger/logger.mts';
import { createPageable } from '../service/pageable.mts';
import { createPage } from './page.mts';

const { buchService } = container;

/**
 * Router für die Verwaltung von Bücher.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const router = new Hono();

const logger = getLogger('buch-router', 'file');

// -----------------------------------------------------------------------------
// S u c h e   m i t   P f a d - P a r a m e t e r
// -----------------------------------------------------------------------------
// Empfehlung: Handler direkt nach der Pfad-Definition, keine ausgelagerten Controller
// https://hono.dev/docs/guides/best-practices#don-t-make-controllers-when-possible
router.get('/:id', async (c) => {
    const { req } = c;
    // https://hono.dev/docs/api/request
    const accept = req.header('Accept')?.toLowerCase();
    if (accept !== undefined && !/(json|html)/.test(accept)) {
        logger.debug('get: Accept=%s', accept);
        // https://hono.dev/docs/api/context#body
        // Not Acceptable
        return c.body(null, 406);
    }

    const id = req.param('id');
    logger.debug('get: id=%s', id);
    const idNumber = Number.parseInt(id, 10);
    if (Number.isNaN(idNumber)) {
        // https://hono.dev/docs/api/context#notfound
        return c.notFound();
    }

    const buch = await buchService.findById({ id: idNumber });

    // ETags
    // https://hono.dev/docs/api/request#header
    const ifNonMatch = req.header('If-None-Match');
    const { version } = buch;
    if (ifNonMatch === `"${version}"`) {
        logger.debug('get: Not Modified');
        // https://hono.dev/docs/api/context#body
        return c.body(null, 304);
    }

    logger.debug('get: version=%d', version ?? -1);
    // https://hono.dev/docs/api/context#header
    const { header, json } = c;
    header('ETag', `"${version}"`);

    logger.debug('get: %o', buch);
    return json(buch);
});

// -----------------------------------------------------------------------------
// S u c h e   m i t   Q u e r y - P a r a m e t e r
// -----------------------------------------------------------------------------
router.get('/', async (c) => {
    const { req } = c;
    const accept = req.header('Accept')?.toLowerCase();
    if (
        accept !== undefined &&
        accept !== '*/*' &&
        !/(json|html)/.test(accept)
    ) {
        logger.debug('get: Accept=%s', accept);
        return c.body(null, 406);
    }

    const queryParams = req.query();
    const countOnly = queryParams['count-only'];
    if (countOnly !== undefined) {
        const count = await buchService.count();
        logger.debug('get: count=%d', count);
        return c.json({ count });
    }

    const { page, size } = queryParams;
    delete queryParams['page'];
    delete queryParams['size'];
    logger.debug(
        'get: page=%s, size=%s,  queryParams=%o',
        page,
        size,
        queryParams,
    );

    const pageable = createPageable({ number: page, size });
    const buecherSlice = await buchService.find(queryParams, pageable); // NOSONAR
    const buchPage = createPage(buecherSlice, pageable);
    logger.debug('get: buchPage=%o', buchPage);
    return c.json(buchPage);
});

// -----------------------------------------------------------------------------
// D o w n l o a d
// -----------------------------------------------------------------------------
router.get('/file/:id', async (c) => {
    const id = c.req.param('id');
    logger.debug('download: id=%s', id);
    const idNumber = Number.parseInt(id, 10);
    if (Number.isNaN(idNumber)) {
        return c.notFound();
    }

    const buchFile = await buchService.findFileByBuchId(idNumber);
    if (buchFile === undefined) {
        return c.notFound();
    }

    return c.body(buchFile.data, {
        headers: { 'Content-Type': buchFile.mimetype ?? '' },
    });
});
