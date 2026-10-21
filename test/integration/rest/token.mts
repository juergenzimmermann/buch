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

import axios, { type AxiosResponse } from 'axios';
import { baseURL, tokenPath } from '../constants.mts';

const tokenURL = `${baseURL}${tokenPath}`;
// "Accept: APPLICATION_JSON" ist default https://axios.rest/pages/advanced/request-config.html#headers
export const client = axios.create({
    baseURL: tokenURL,
    httpVersion: 2,
    validateStatus: () => true,
});

export const getToken = async (username: string, password: string) => {
    const body = {
        username,
        password,
    };

    const { data, status }: AxiosResponse<{ access_token: string }> = await client.query('', body);

    if (
        status !== 200 ||
        data.access_token === undefined ||
        typeof data.access_token !== 'string'
    ) {
        console.error(`!!!tokenURL=${tokenURL}`);
        console.error(`!!!username=${username}, password=${password}`);
        console.error(`!!!status=${status}`);
        console.error('!!!body=%j', data);
        throw new Error('Statuscode ist nicht 200 oder kein String als Token');
    }
    return data.access_token;
};
