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
import BigNumber from 'bignumber.js';
import { describe, expect, test } from 'vitest';
import { type Page } from '../../../src/buch/controller/page.js';
import { CONTENT_TYPE, restURL } from '../constants.mjs';
import { Buch } from '../../../src/generated/prisma/client.js';
import { BuchMitTitel } from '../../../src/buch/service/buch-service.js';

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
    test.concurrent('Alle Buecher', async () => {
        // given

        // when
        const response = await fetch(restURL);
        const { status, headers } = response;

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers.get(CONTENT_TYPE)).toMatch(/json/iu);

        const body = (await response.json()) as Page<Buch>;

        body.content
            .map((buch) => buch.id)
            .forEach((id) => {
                expect(id).toBeDefined();
            });
    });

    test.concurrent.each(titelArray)(
        'Buecher mit Teil-Titel %s suchen',
        async (titel) => {
            // given
            const params = new URLSearchParams({ titel });
            const url = `${restURL}?${params}`;

            // when
            const response = await fetch(url);
            const { status, headers } = response;

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers.get(CONTENT_TYPE)).toMatch(/json/iu);

            const body = (await response.json()) as Page<BuchMitTitel>;

            expect(body).toBeDefined();

            // Jedes Buch hat einen Titel mit dem Teilstring
            body.content
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
            const params = new URLSearchParams({ titel });
            const url = `${restURL}?${params}`;

            // when
            const { status } = await fetch(url);

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);
        },
    );

    test.concurrent.each(isbns)('Buch mit ISBN %s suchen', async (isbn) => {
        // given
        const params = new URLSearchParams({ isbn });
        const url = `${restURL}?${params}`;

        // when
        const response = await fetch(url);
        const { status, headers } = response;

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers.get(CONTENT_TYPE)).toMatch(/json/iu);

        const body = (await response.json()) as Page<Buch>;

        expect(body).toBeDefined();

        // 1 Buch mit der ISBN
        const buecher = body.content;

        expect(buecher).toHaveLength(1);

        const [buch] = buecher;
        const isbnFound = buch?.isbn;

        expect(isbnFound).toBe(isbn);
    });

    test.concurrent.each(ratingMin)(
        'Buecher mit Mindest-"rating" %i suchen',
        async (rating) => {
            // given
            const params = new URLSearchParams({ rating: rating.toString() });
            const url = `${restURL}?${params}`;

            // when
            const response = await fetch(url);
            const { status, headers } = response;

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers.get(CONTENT_TYPE)).toMatch(/json/iu);

            const body = (await response.json()) as Page<Buch>;

            // Jedes Buch hat eine Bewertung >= rating
            body.content
                .map((buch) => buch.rating)
                .forEach((r) => expect(r).toBeGreaterThanOrEqual(rating));
        },
    );

    test.concurrent.each(preisMax)(
        'Buecher mit max. Preis %d suchen',
        async (preis) => {
            // given
            const params = new URLSearchParams({ preis: preis.toString() });
            const url = `${restURL}?${params}`;

            // when
            const response = await fetch(url);
            const { status, headers } = response;

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers.get(CONTENT_TYPE)).toMatch(/json/iu);

            const body = (await response.json()) as Page<Buch>;

            // Jedes Buch hat einen Preis <= preis
            body.content
                .map((buch) => BigNumber(buch?.preis?.toString() ?? 0))
                .forEach((p) =>
                    expect(p.isLessThanOrEqualTo(BigNumber(preis))).toBe(true),
                );
        },
    );

    test.concurrent.each(schlagwoerter)(
        'Mind. 1 Buch mit Schlagwort %s',
        async (schlagwort) => {
            // given
            const params = new URLSearchParams({ [schlagwort]: 'true' });
            const url = `${restURL}?${params}`;

            // when
            const response = await fetch(url);
            const { status, headers } = response;

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers.get(CONTENT_TYPE)).toMatch(/json/iu);

            const body = (await response.json()) as Page<Buch>;

            // JSON-Array mit mind. 1 JSON-Objekt
            expect(body).toBeDefined();

            // Jedes Buch hat im Array der Schlagwoerter z.B. "javascript"
            body.content
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
            const params = new URLSearchParams({ [schlagwort]: 'true' });
            const url = `${restURL}?${params}`;

            // when
            const { status } = await fetch(url);

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);
        },
    );

    test.concurrent(
        'Keine Buecher zu einer nicht-vorhandenen Property',
        async () => {
            // given
            const params = new URLSearchParams({ foo: 'bar' });
            const url = `${restURL}?${params}`;

            // when
            const { status } = await fetch(url);

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);
        },
    );
});
