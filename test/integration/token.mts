// Copyright (C) 2025 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { APPLICATION_JSON, CONTENT_TYPE, QUERY, baseURL, tokenPath } from './constants.mts';

export const getToken = async (username: string, password: string) => {
    const headers = new Headers();
    headers.append(CONTENT_TYPE, APPLICATION_JSON);
    const body = {
        username,
        password,
    };

    const response = await fetch(`${baseURL}${tokenPath}`, {
        method: QUERY,
        body: JSON.stringify(body),
        headers,
    });

    const responseBody = (await response.json()) as { access_token: string };
    if (
        response.status !== 200 ||
        responseBody.access_token === undefined ||
        typeof responseBody.access_token !== 'string'
    ) {
        console.error(`!!!username=${username}, password=${password}`);
        console.error(`!!!status=${response.status}`);
        console.error('!!!body=%j', responseBody);
        throw new Error('Statuscode ist nicht 200 oder kein String als Token');
    }
    return responseBody.access_token;
};
