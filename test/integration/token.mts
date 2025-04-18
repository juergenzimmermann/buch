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

import { type AxiosInstance, type AxiosResponse } from 'axios';
import { httpsAgent, tokenPath } from './constants.mjs';

type TokenResult = {
    access_token: string;
};

export const getToken = async (
    axiosInstance: AxiosInstance,
    username: string,
    password: string,
) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    const response: AxiosResponse<TokenResult> = await axiosInstance.post(
        tokenPath,
        `username=${username}&password=${password}`,
        { headers, httpsAgent },
    );

    const { access_token } = response.data;
    if (
        response.status !== 200 ||
        access_token === undefined ||
        typeof access_token !== 'string'
    ) {
        console.log(`!!!username=${username}, password=${password}`);
        console.log(`!!!response=${JSON.stringify(response.status)}`);
        console.log(`!!!response=${JSON.stringify(response.data)}`);
        throw new Error('Statuscode ist nicht 200 oder kein String als Token');
    }
    return access_token;
};
