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

import { type GraphQLQuery } from './graphql.mjs';
import {
    ACCEPT,
    APPLICATION_JSON,
    CONTENT_TYPE,
    GRAPHQL_RESPONSE_JSON,
    POST,
    graphqlURL,
} from '../constants.mjs';

export const getToken = async (
    username: string,
    password: string,
): Promise<string> => {
    const headers = new Headers();
    headers.append(CONTENT_TYPE, APPLICATION_JSON);
    headers.append(ACCEPT, GRAPHQL_RESPONSE_JSON);

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

    const response = await fetch(graphqlURL, {
        method: POST,
        body: JSON.stringify(query),
        headers,
    });

    const body = (await response.json()) as {
        data: { token: { access_token: string } };
    };
    const { access_token } = body.data.token;
    if (access_token === undefined || typeof access_token !== 'string') {
        throw new Error('Der Token fuer GraphQL ist kein String');
    }
    return access_token;
};
