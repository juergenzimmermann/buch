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

import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { Decimal } from 'decimal.js';
import { beforeAll, describe, expect, test } from 'vitest';
import { type Page } from '../../../src/buch/controller/page.js';
import { type Buch } from '../../../src/buch/entity/buch.entity.js';
import { httpsAgent, restURL } from '../constants.mjs';
import { type ErrorResponse } from './error-response.mjs';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const titelArray = ['a', 'l', 't'];
const titelNichtVorhanden = ['xxx', 'yyy', 'zzz'];
const isbns = ['978-3-897-22583-1', '978-3-827-31552-6', '978-0-201-63361-0'];
const ratingMin = [3, 4];
const preisMax = [33.5, 66.6];
const schlagwoerter = ['javascript', 'typescript'];
const schlagwoerterNichtVorhanden = ['csharp', 'cobol'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('GET /rest', () => {
    let client: AxiosInstance;

    // Axios initialisieren
    beforeAll(async () => {
        client = axios.create({
            baseURL: restURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    test.concurrent('Alle Buecher', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<Page<Buch>> =
            await client.get('/');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        data.content
            .map((buch) => buch.id)
            .forEach((id) => {
                expect(id).toBeDefined();
            });
    });

    test.concurrent.each(titelArray)(
        'Buecher mit Teil-Titel %s suchen',
        async (titel) => {
            // given
            const params = { titel };

            // when
            const { status, headers, data }: AxiosResponse<Page<Buch>> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            // Jedes Buch hat einen Titel mit dem Teilstring
            data.content
                .map((buch) => buch.titel)
                .forEach((t) =>
                    expect(t?.titel?.toLowerCase()).toStrictEqual(
                        expect.stringContaining(titel),
                    ),
                );
        },
    );

    test.concurrent.each(titelNichtVorhanden)(
        'Buecher zu nicht vorhandenem Teil-Titel %s suchen',
        async (titel) => {
            // given
            const params = { titel };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );

    test.concurrent.each(isbns)('Buch mit ISBN %s suchen', async (isbn) => {
        // given
        const params = { isbn };

        // when
        const { status, headers, data }: AxiosResponse<Page<Buch>> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        // 1 Buch mit der ISBN
        const buecher = data.content;

        expect(buecher).toHaveLength(1);

        const isbnFound = buecher[0].isbn;

        expect(isbnFound).toBe(isbn);
    });

    test.concurrent.each(ratingMin)(
        'Buecher mit Mindest-"rating" %i suchen',
        async (rating) => {
            // given
            const params = { rating };

            // when
            const { status, headers, data }: AxiosResponse<Page<Buch>> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            // Jedes Buch hat eine Bewertung >= rating
            data.content
                .map((buch) => buch.rating)
                .forEach((r) => expect(r).toBeGreaterThanOrEqual(rating));
        },
    );

    test.concurrent.each(preisMax)(
        'Buecher mit max. Preis %d suchen',
        async (preis) => {
            // given
            const params = { preis };

            // when
            const { status, headers, data }: AxiosResponse<Page<Buch>> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            // Jedes Buch hat einen Preis <= preis
            data.content
                .map((buch) => Decimal(buch?.preis ?? 0))
                .forEach((p) =>
                    expect(p.lessThanOrEqualTo(Decimal(preis))).toBe(true),
                );
        },
    );

    test.concurrent.each(schlagwoerter)(
        'Mind. 1 Buch mit Schlagwort %s',
        async (schlagwort) => {
            // given
            const params = { [schlagwort]: 'true' };

            // when
            const { status, headers, data }: AxiosResponse<Page<Buch>> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            expect(data).toBeDefined();

            // Jedes Buch hat im Array der Schlagwoerter z.B. "javascript"
            data.content
                .map((buch) => buch.schlagwoerter)
                .forEach((schlagwoerter) =>
                    expect(schlagwoerter).toStrictEqual(
                        expect.arrayContaining([schlagwort.toUpperCase()]),
                    ),
                );
        },
    );

    test.concurrent.each(schlagwoerterNichtVorhanden)(
        'Keine Buecher zu einem nicht vorhandenen Schlagwort',
        async (schlagwort) => {
            // given
            const params = { [schlagwort]: 'true' };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );

    test.concurrent(
        'Keine Buecher zu einer nicht-vorhandenen Property',
        async () => {
            // given
            const params = { foo: 'bar' };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );
});
