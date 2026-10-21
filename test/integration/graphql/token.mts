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

import { type AxiosResponse } from 'axios';
import { type GraphQLQuery } from './graphql.mts';
import { client } from './client.mts';

export const getToken = async (username: string, password: string): Promise<string> => {
    const query: GraphQLQuery = {
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

    // when
    const {
        data,
    }: AxiosResponse<{
        data: { token: { access_token: string } };
    }> = await client.post('', query);

    const { access_token } = data.data.token;
    if (typeof access_token !== 'string') {
        throw new Error('Der Token fuer GraphQL ist kein String');
    }
    return access_token;
};
