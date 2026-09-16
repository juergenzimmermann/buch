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
 * Das Modul besteht aus Router für die Authentifizierung an der
 * REST-Schnittstelle.
 * @packageDocumentation
 */

import { createProblemDetails, unauthorized } from '../problem-details.mts';
import { Hono } from 'hono';
import { getLogger } from '../logger/logger.mts';
import { paths } from '../config/paths.mts';
import { token } from './keycloak-service.mts';

/** Entity-Klasse für Token-Daten. */
export class TokenData {
    /** Benutzername */
    username: string | undefined;

    /** Passwort */
    password: string | undefined;
}

/**
 * Router für die Authentifizierung an der REST-Schnittstelle.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const router = new Hono();

const logger = getLogger('auth-router/query', 'func');
router.query(paths.token, async (c) => {
    const { req } = c;
    let requestBody: any;
    try {
        requestBody = await req.json();
    } catch {
        return createProblemDetails(c, unauthorized, 'Fehler beim Authentifizieren');
    }
    if (requestBody === null || typeof requestBody !== 'object') {
        return createProblemDetails(c, unauthorized, 'Fehler beim Authentifizieren');
    }
    const { username, password } = requestBody;
    logger.debug('query: username=%s', username);

    const result = await token({
        username,
        password,
    });
    if (result === undefined) {
        return createProblemDetails(c, unauthorized, 'Fehler beim Authentifizieren');
    }

    return c.json(result);
});
