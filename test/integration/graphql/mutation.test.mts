/* eslint-disable @typescript-eslint/no-non-null-assertion */
// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { HttpStatus } from '@nestjs/common';
import { beforeAll, describe, expect, test } from 'vitest';
import {
    ACCEPT,
    APPLICATION_JSON,
    AUTHORIZATION,
    BEARER,
    CONTENT_TYPE,
    GRAPHQL_RESPONSE_JSON,
    POST,
    graphqlURL,
} from '../constants.mjs';
import { type GraphQLQuery } from './graphql.mjs';
import { ErrorsType } from './query.test.mjs';
import { getToken } from './token.mjs';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idLoeschen = '60';

type CreateSuccessType = {
    data: { create: { id: string } };
    errors?: undefined;
};
type CreateErrorsType = { data: { create: null }; errors: ErrorsType };

type UpdateSuccessType = {
    data: { update: { version: number } };
    errors?: undefined;
};
type UpdateErrorsType = { data: { update: null }; errors: ErrorsType };

type DeleteSuccessType = {
    data: { delete: { success: boolean } };
    errors?: undefined;
};
type DeleteErrorsType = { data: { delete: null }; errors: ErrorsType };

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('GraphQL Mutations', () => {
    let token: string;
    let tokenUser: string;

    beforeAll(async () => {
        token = await getToken('admin', 'p');
        tokenUser = await getToken('user', 'p');
    });

    // -------------------------------------------------------------------------
    test('Neues Buch', async () => {
        // given
        const mutation: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            isbn: "978-1-491-95035-7",
                            rating: 1,
                            art: EPUB,
                            preis: 99.99,
                            rabatt: 0.0123,
                            lieferbar: true,
                            datum: "2022-02-28T00:00:00Z",
                            homepage: "https://create.mutation",
                            schlagwoerter: ["JAVASCRIPT", "TYPESCRIPT"],
                            titel: {
                                titel: "Titelcreatemutation",
                                untertitel: "untertitelcreatemutation"
                            },
                            abbildungen: [{
                                beschriftung: "Abb. 1",
                                contentType: "img/png"
                            }]
                        }
                    ) {
                        id
                    }
                }
            `,
        };
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(ACCEPT, GRAPHQL_RESPONSE_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${token}`);

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(mutation),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data } = (await response.json()) as CreateSuccessType;

        expect(data).toBeDefined();

        const { create } = data;

        // Der Wert der Mutation ist die generierte ID
        expect(create).toBeDefined();

        const { id } = create;

        expect(parseInt(id, 10)).toBeGreaterThan(0);
    });

    // -------------------------------------------------------------------------
    test('Buch mit ungueltigen Werten neu anlegen', async () => {
        // given
        const mutation: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            isbn: "falsche-ISBN",
                            rating: -1,
                            art: EPUB,
                            preis: -1,
                            rabatt: 2,
                            lieferbar: false,
                            datum: "12345-123-123",
                            homepage: "anyHomepage",
                            titel: {
                                titel: "?!"
                            }
                        }
                    ) {
                        id
                    }
                }
            `,
        };
        const expectedMsg = [
            expect.stringMatching(/^isbn /u),
            expect.stringMatching(/^rating /u),
            expect.stringMatching(/^preis /u),
            expect.stringMatching(/^rabatt /u),
            expect.stringMatching(/^datum /u),
            expect.stringMatching(/^homepage /u),
            expect.stringMatching(/^titel.titel /u),
        ];
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(ACCEPT, GRAPHQL_RESPONSE_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${token}`);

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(mutation),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as CreateErrorsType;

        expect(data.create).toBeNull();
        expect(errors).toHaveLength(1);

        const [error] = errors;

        expect(error).toBeDefined();

        const { message } = error!;
        const messages: string[] = message.split(',');

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toStrictEqual(expect.arrayContaining(expectedMsg));
    });

    // -------------------------------------------------------------------------
    test('Buch aktualisieren', async () => {
        // given
        const mutation: GraphQLQuery = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "40",
                            version: 0,
                            isbn: "978-0-007-09732-6",
                            rating: 5,
                            art: HARDCOVER,
                            preis: 444.44,
                            rabatt: 0.099,
                            lieferbar: false,
                            datum: "2025-04-04T00:00:00Z",
                            homepage: "https://update.mutation"
                            schlagwoerter: ["JAVA", "PYTHON"],
                        }
                    ) {
                        version
                    }
                }
            `,
        };
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(ACCEPT, GRAPHQL_RESPONSE_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${token}`);

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(mutation),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as UpdateSuccessType;

        expect(errors).toBeUndefined();

        const { update } = data;

        // Der Wert der Mutation ist die neue Versionsnummer
        expect(update.version).toBe(1);
    });

    // -------------------------------------------------------------------------
    test('Buch mit ungueltigen Werten aktualisieren', async () => {
        // given
        const id = '40';
        const mutation: GraphQLQuery = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "${id}",
                            version: 0,
                            isbn: "falsche-ISBN",
                            rating: -1,
                            art: EPUB,
                            preis: -1,
                            rabatt: 2,
                            lieferbar: false,
                            datum: "12345-123-123",
                            homepage: "anyHomepage",
                            schlagwoerter: ["JAVASCRIPT", "TYPESCRIPT"]
                        }
                    ) {
                        version
                    }
                }
            `,
        };
        const expectedMsg = [
            expect.stringMatching(/^isbn /u),
            expect.stringMatching(/^rating /u),
            expect.stringMatching(/^preis /u),
            expect.stringMatching(/^rabatt /u),
            expect.stringMatching(/^datum /u),
            expect.stringMatching(/^homepage /u),
        ];
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(ACCEPT, GRAPHQL_RESPONSE_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${token}`);

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(mutation),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as UpdateErrorsType;

        expect(data.update).toBeNull();
        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message } = error!;
        const messages: string[] = message.split(',');

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toStrictEqual(expect.arrayContaining(expectedMsg));
    });

    // -------------------------------------------------------------------------
    test('Nicht-vorhandenes Buch aktualisieren', async () => {
        // given
        const id = '999999';
        const mutation: GraphQLQuery = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "${id}",
                            version: 0,
                            isbn: "978-0-007-09732-6",
                            rating: 5,
                            art: EPUB,
                            preis: 99.99,
                            rabatt: 0.099,
                            lieferbar: false,
                            datum: "2021-01-02T00:00:00Z",
                            homepage: "https://acme.com",
                            schlagwoerter: ["JAVASCRIPT", "TYPESCRIPT"]
                        }
                    ) {
                        version
                    }
                }
            `,
        };
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(ACCEPT, GRAPHQL_RESPONSE_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${token}`);

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(mutation),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as UpdateErrorsType;

        expect(data.update).toBeNull();
        expect(errors).toHaveLength(1);

        const [error] = errors!;

        expect(error).toBeDefined();

        const { message, path, extensions } = error!;

        expect(message).toBe(
            `Es gibt kein Buch mit der ID ${id.toLowerCase()}.`,
        );
        expect(path).toBeDefined();
        expect(path![0]).toBe('update');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    // -------------------------------------------------------------------------
    test('Buch loeschen', async () => {
        // given
        const mutation: GraphQLQuery = {
            query: `
                mutation {
                    delete(id: "${idLoeschen}") {
                        success
                    }
                }
            `,
        };
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(ACCEPT, GRAPHQL_RESPONSE_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${token}`);

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(mutation),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as DeleteSuccessType;

        expect(errors).toBeUndefined();
        // Der Wert der Mutation ist true (falls geloescht wurde) oder false
        expect(data.delete.success).toBe(true);
    });

    // -------------------------------------------------------------------------
    test('Buch loeschen als "user"', async () => {
        // given
        const mutation: GraphQLQuery = {
            query: `
                mutation {
                    delete(id: "${idLoeschen}") {
                        success
                    }
                }
            `,
        };
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(ACCEPT, GRAPHQL_RESPONSE_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${tokenUser}`);

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(mutation),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as DeleteErrorsType;

        expect(data.delete).toBeNull();

        const [error] = errors!;

        expect(error).toBeDefined();

        const { message, extensions } = error!;

        expect(message).toBe('Forbidden resource');
        expect(extensions.code).toBe('BAD_USER_INPUT');
    });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
