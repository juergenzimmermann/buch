/* eslint-disable @typescript-eslint/no-non-null-assertion */
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

import { type GraphQLRequest } from '@apollo/server';
import { HttpStatus } from '@nestjs/common';
import { beforeAll, describe, expect, test } from 'vitest';
import {
    ACCEPT,
    APPLICATION_JSON,
    CONTENT_TYPE,
    GRAPHQL_RESPONSE_JSON,
    POST,
    graphqlURL,
} from '../constants.mjs';
import { Buchart, type Prisma } from '../../../src/generated/prisma/client.js';

export type BuchDTO = Omit<
    Prisma.BuchGetPayload<{
        include: {
            titel: true;
        };
    }>,
    'aktualisiert' | 'erzeugt' | 'rabatt'
>;

type BuchSuccessType = { data: { buch: BuchDTO }; errors?: undefined };
type BuecherSuccessType = { data: { buecher: BuchDTO[] }; errors?: undefined };

export type ErrorsType = {
    message: string;
    path: string[];
    extensions: { code: string };
}[];
type BuchErrorsType = { data: { buch: null }; errors: ErrorsType };
type BuecherErrorsType = { data: { buecher: null }; errors: ErrorsType };

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const ids = [1, 20];

const titelArray = ['a', 'l', 't'];
const titelNichtVorhanden = ['xxx', 'yyy', 'zzz'];
const isbns = ['978-3-897-22583-1', '978-3-827-31552-6', '978-0-201-63361-0'];
const ratingMin = [3, 4];
const ratingNichtVorhanden = 99;

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('GraphQL Queries', () => {
    let headers: Headers;

    beforeAll(() => {
        headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(ACCEPT, GRAPHQL_RESPONSE_JSON);
    });

    test.concurrent.each(ids)('Buch zu ID %i', async (id) => {
        // given
        const query: GraphQLRequest = {
            query: `
                {
                    buch(id: "${id}") {
                        version
                        isbn
                        rating
                        art
                        preis
                        lieferbar
                        datum
                        homepage
                        schlagwoerter
                        titel {
                            titel
                        }
                        rabatt(short: true)
                    }
                }
            `,
        };

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(query),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as BuchSuccessType;

        expect(errors).toBeUndefined();
        expect(data).toBeDefined();

        const { buch } = data;

        expect(buch.titel?.titel).toMatch(/^\w/u);
        expect(buch.version).toBeGreaterThan(-1);
        expect(buch.id).toBeUndefined();
    });

    test.concurrent('Buch zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const query: GraphQLRequest = {
            query: `
                {
                    buch(id: "${id}") {
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(query),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as BuchErrorsType;

        expect(data.buch).toBeNull();
        expect(errors).toHaveLength(1);

        const [error] = errors;
        const { message, path, extensions } = error!;

        expect(message).toBe(`Es gibt kein Buch mit der ID ${id}.`);
        expect(path).toBeDefined();
        expect(path![0]).toBe('buch');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent.each(titelArray)(
        'Buecher zu Teil-Titel %s',
        async (titel) => {
            // given
            const query: GraphQLRequest = {
                query: `
                    {
                        buecher(suchparameter: {
                            titel: "${titel}"
                        }) {
                            titel {
                                titel
                            }
                        }
                    }
                `,
            };

            // when
            const response = await fetch(graphqlURL, {
                method: POST,
                body: JSON.stringify(query),
                headers,
            });

            // then
            const { status } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(response.headers.get(CONTENT_TYPE)).toMatch(
                /application\/graphql-response\+json/iu,
            );

            const { data, errors } =
                (await response.json()) as BuecherSuccessType;

            expect(errors).toBeUndefined();
            expect(data).toBeDefined();

            const { buecher } = data;

            expect(buecher).not.toHaveLength(0);

            buecher
                .map((buch) => buch.titel)
                .forEach((t) =>
                    expect(t?.titel?.toLowerCase()).toStrictEqual(
                        expect.stringContaining(titel),
                    ),
                );
        },
    );

    test.concurrent.each(titelNichtVorhanden)(
        'Buch zu nicht vorhandenem Titel %s',
        async (titel) => {
            // given
            const query: GraphQLRequest = {
                query: `
                    {
                        buecher(suchparameter: {
                            titel: "${titel}"
                        }) {
                            art
                            titel {
                                titel
                            }
                        }
                    }
                `,
            };

            // when
            const response = await fetch(graphqlURL, {
                method: POST,
                body: JSON.stringify(query),
                headers,
            });

            // then
            const { status } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(response.headers.get(CONTENT_TYPE)).toMatch(
                /application\/graphql-response\+json/iu,
            );

            const { data, errors } =
                (await response.json()) as BuecherErrorsType;

            expect(data.buecher).toBeNull();
            expect(errors).toHaveLength(1);

            const [error] = errors;
            const { message, path, extensions } = error!;

            expect(message).toMatch(/^Keine Buecher gefunden:/u);
            expect(path).toBeDefined();
            expect(path![0]).toBe('buecher');
            expect(extensions).toBeDefined();
            expect(extensions!.code).toBe('BAD_USER_INPUT');
        },
    );

    test.concurrent.each(isbns)(
        'Buch zu ISBN-Nummer %s',
        async (isbnExpected) => {
            // given
            const query: GraphQLRequest = {
                query: `
                    {
                        buecher(suchparameter: {
                            isbn: "${isbnExpected}"
                        }) {
                            isbn
                            titel {
                                titel
                            }
                        }
                    }
                `,
            };

            // when
            const response = await fetch(graphqlURL, {
                method: POST,
                body: JSON.stringify(query),
                headers,
            });

            // then
            const { status } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(response.headers.get(CONTENT_TYPE)).toMatch(
                /application\/graphql-response\+json/iu,
            );

            const { data, errors } =
                (await response.json()) as BuecherSuccessType;

            expect(errors).toBeUndefined();
            expect(data).toBeDefined();

            const { buecher } = data;

            expect(buecher).not.toHaveLength(0);
            expect(buecher).toHaveLength(1);

            const [buch] = buecher;
            const { titel, isbn } = buch!;

            expect(isbn).toBe(isbnExpected);
            expect(titel?.titel).toBeDefined();
        },
    );

    test.concurrent.each(ratingMin)(
        'Buecher mit Mindest-"rating" %i',
        async (ratingExpected) => {
            // given
            const teilTitel = 'a';
            const query: GraphQLRequest = {
                query: `
                    {
                        buecher(suchparameter: {
                            rating: ${ratingExpected},
                            titel: "${teilTitel}"
                        }) {
                            rating
                            titel {
                                titel
                            }
                        }
                    }
                `,
            };

            // when
            const response = await fetch(graphqlURL, {
                method: POST,
                body: JSON.stringify(query),
                headers,
            });

            // then
            const { status } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(response.headers.get(CONTENT_TYPE)).toMatch(
                /application\/graphql-response\+json/iu,
            );

            const { data, errors } =
                (await response.json()) as BuecherSuccessType;

            expect(errors).toBeUndefined();
            expect(data).toBeDefined();

            const { buecher } = data;

            expect(buecher).not.toHaveLength(0);

            buecher.forEach((buch) => {
                const { rating, titel } = buch;

                expect(rating).toBeGreaterThanOrEqual(ratingExpected);
                expect(titel?.titel?.toLowerCase()).toStrictEqual(
                    expect.stringContaining(teilTitel),
                );
            });
        },
    );

    test.concurrent('Kein Buch zu nicht-vorhandenem "rating"', async () => {
        // given
        const query: GraphQLRequest = {
            query: `
                {
                    buecher(suchparameter: {
                        rating: ${ratingNichtVorhanden}
                    }) {
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(query),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as BuecherErrorsType;

        expect(data.buecher).toBeNull();
        expect(errors).toHaveLength(1);

        const [error] = errors;
        const { message, path, extensions } = error!;

        expect(message).toMatch(/^Keine Buecher gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('buecher');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Buecher zur Art "EPUB"', async () => {
        // given
        const buchArt: Buchart = 'EPUB';
        const query: GraphQLRequest = {
            query: `
                {
                    buecher(suchparameter: {
                        art: ${buchArt}
                    }) {
                        art
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(query),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as BuecherSuccessType;

        expect(errors).toBeUndefined();
        expect(data).toBeDefined();

        const { buecher }: { buecher: BuchDTO[] } = data;

        expect(buecher).not.toHaveLength(0);

        buecher.forEach((buch) => {
            const { art, titel } = buch;

            expect(art).toBe(buchArt);
            expect(titel?.titel).toBeDefined();
        });
    });

    test.concurrent('Buecher zur einer ungueltigen Art', async () => {
        // given
        const buchArt = 'UNGUELTIG';
        const query: GraphQLRequest = {
            query: `
                {
                    buecher(suchparameter: {
                        art: ${buchArt}
                    }) {
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(query),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as BuecherErrorsType;

        expect(data).toBeUndefined();
        expect(errors).toHaveLength(1);

        const [error] = errors;
        const { extensions } = error!;

        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('GRAPHQL_VALIDATION_FAILED');
    });

    test.concurrent('Buecher mit lieferbar=true', async () => {
        // given
        const query: GraphQLRequest = {
            query: `
                {
                    buecher(suchparameter: {
                        lieferbar: true
                    }) {
                        lieferbar
                        titel {
                            titel
                        }
                    }
                }
            `,
        };

        // when
        const response = await fetch(graphqlURL, {
            method: POST,
            body: JSON.stringify(query),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(response.headers.get(CONTENT_TYPE)).toMatch(
            /application\/graphql-response\+json/iu,
        );

        const { data, errors } = (await response.json()) as BuecherSuccessType;

        expect(errors).toBeUndefined();
        expect(data).toBeDefined();

        const { buecher }: { buecher: BuchDTO[] } = data;

        expect(buecher).not.toHaveLength(0);

        buecher.forEach((buch) => {
            const { lieferbar, titel } = buch;

            expect(lieferbar).toBe(true);
            expect(titel?.titel).toBeDefined();
        });
    });
});

/* eslint-enable @typescript-eslint/no-non-null-assertion */
