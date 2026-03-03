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
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

import type { HonoRequest } from 'hono';
import { BuchService } from '../service/buch-service.mts';

export const createBaseUrl: (req: HonoRequest) => string = (
    req: HonoRequest,
) => {
    const { url } = req;
    // Query-String entfernen, falls vorhanden
    let baseUrl = url.includes('?') ? url.slice(0, url.lastIndexOf('?')) : url;

    // ID entfernen, falls der Pfad damit endet
    const indexLastSlash = baseUrl.lastIndexOf('/');
    if (indexLastSlash > 0) {
        const idStr = baseUrl.slice(indexLastSlash + 1);
        if (BuchService.ID_PATTERN.test(idStr)) {
            baseUrl = baseUrl.slice(0, indexLastSlash);
        }
    }

    return baseUrl;
};
