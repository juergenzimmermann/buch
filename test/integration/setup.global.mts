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

// https://vitest.dev/config/#globalsetup

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { baseURL, httpsAgent } from './constants.mjs';
import { getToken } from './token.mjs';

type DbPopulateResult = {
    db_populate: string;
};

const dbPopulate = async (axiosInstance: AxiosInstance, token: string) => {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };

    const response: AxiosResponse<DbPopulateResult> = await axiosInstance.post(
        '/dev/db_populate',
        '',
        { headers },
    );
    const { db_populate } = response.data;
    if (db_populate !== 'success') {
        throw new Error('Fehler bei POST /dev/db_populate');
    }
    console.log('DB wurde neu geladen');
};

// https://vitest.dev/config/#globalsetup
export default async function setup() {
    const client = axios.create({
        baseURL,
        httpsAgent,
    });
    const token = await getToken(client, 'admin', 'p');
    console.log(`setup: token=${token}`);
    await dbPopulate(client, token);
}
