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

import { type AxiosInstance, type AxiosResponse } from 'axios';
import { httpsAgent } from '../constants.mjs';
import { type GraphQLQuery, type GraphQLResponseBody } from './graphql.mjs';

export const getToken = async (
    axiosInstance: AxiosInstance,
    username: string,
    password: string,
): Promise<string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/graphql-response+json',
    };
    const body: GraphQLQuery = {
        query: `
            mutation {
                token(
                    username: "${username}",
                    password: "${password}"
                ) {
                    access_token
                }
            }
        `,
    };

    const response: AxiosResponse<GraphQLResponseBody> =
        await axiosInstance.post('graphql', body, { headers, httpsAgent });

    const data = response.data.data!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const { access_token } = data.token;
    if (access_token === undefined || typeof access_token !== 'string') {
        throw new Error('Der Token fuer GraphQL ist kein String');
    }
    return access_token;
};
