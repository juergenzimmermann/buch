// Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { Hono } from 'hono';

/**
 * Das Modul besteht aus dem Router für Liveness und Readiness.
 * @packageDocumentation
 */
export const router = new Hono();

router.get('/liveness', (c) => {
    return c.json({ status: 'up' });
});

router.get('/readiness', (c) => {
    // TODO "SELECT 1" mit Prisma
    return c.json({ status: 'up' });
});
