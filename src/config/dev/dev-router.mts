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

/**
 * Das Modul besteht aus der Controller-Klasse für die Entwicklung.
 * @packageDocumentation
 */

import { Hono } from 'hono';
import { container } from '../../container.mts';
import { roleRequired } from '../../security/role-required.mts';

/**
 * Router für die Entwicklung, z.B. Neuladen der DB.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const router = new Hono();

router.post('/db_populate', roleRequired('admin'), async (c) => {
    await container.dbPopulateService.populate();
    const success = {
        // eslint-disable-next-line @typescript-eslint/naming-convention, camelcase
        db_populate: 'ok',
    };
    return c.json(success);
});
