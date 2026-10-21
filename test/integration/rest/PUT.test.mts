// oxlint-disable max-lines-per-function
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

import { AxiosHeaders, type AxiosResponse, HttpStatusCode } from 'axios';
import { BEARER, IF_MATCH } from '../constants.mts';
import { beforeAll, describe, expect, test } from 'vitest';
import { type BuchUpdateType } from '../../../src/buch/router/buch-validation.mts';
import { type ProblemDetails } from '../../../src/problem-details.mts';
import { client } from './client.mts';
import { getToken } from './token.mts';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const geaendertesBuch: Omit<BuchUpdateType, 'datum'> & {
    datum: string;
} = {
    isbn: '978-0-201-63361-0',
    rating: 5,
    art: 'HARDCOVER',
    preis: 3333,
    rabatt: 0.033,
    lieferbar: true,
    datum: '2025-03-03T00:00:00Z',
    homepage: 'https://geaendert.put.rest',
    schlagwoerter: ['JAVA'],
};
const idVorhanden = '30';

const idNichtVorhanden = '999999';

const geaendertesBuchInvalid: Record<string, unknown> = {
    isbn: 'falsche-ISBN',
    rating: -1,
    art: 'UNSICHTBAR',
    preis: -1,
    rabatt: 2,
    lieferbar: true,
    datum: '12345-123-123',
    homepage: 'anyHomepage',
};

const veraltesBuch: Omit<BuchUpdateType, 'datum'> & {
    datum: string;
} = {
    isbn: '978-0-007-09732-6',
    rating: 1,
    art: 'EPUB',
    preis: 44.4,
    rabatt: 0.04,
    lieferbar: true,
    datum: '2025-02-04T00:00:00Z',
    homepage: 'https://acme.de',
    schlagwoerter: ['JAVASCRIPT'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('PUT /rest/:id', () => {
    let token: string;

    beforeAll(async () => {
        token = await getToken('admin', 'p');
    });

    test('Vorhandenes Buch aendern', async () => {
        // given
        const headers = new AxiosHeaders();
        headers.setAuthorization(`${BEARER} ${token}`);
        headers.set(IF_MATCH, '"0"');

        // when
        const { status } = await client.put(`/${idVorhanden}`, geaendertesBuch, { headers });

        // then
        expect(status).toBe(HttpStatusCode.NoContent);
    });

    test('Nicht-vorhandenes Buch aendern', async () => {
        // given
        const headers = new AxiosHeaders();
        headers.setAuthorization(`${BEARER} ${token}`);
        headers.set(IF_MATCH, '"0"');

        // when
        const { status } = await client.put(`/${idNichtVorhanden}`, geaendertesBuch, { headers });

        // then
        expect(status).toBe(HttpStatusCode.NotFound);
    });

    test('Vorhandenes Buch aendern, aber mit ungueltigen Daten', async () => {
        // given
        const headers = new AxiosHeaders();
        headers.setAuthorization(`${BEARER} ${token}`);
        headers.set(IF_MATCH, '"0"');
        const expectedPaths = ['isbn', 'rating', 'art', 'preis', 'rabatt', 'datum', 'homepage'];

        // when
        const { data, status }: AxiosResponse<ProblemDetails> = await client.put(
            `/${idVorhanden}`,
            geaendertesBuchInvalid,
            {
                headers,
            },
        );

        // then
        expect(status).toBe(HttpStatusCode.UnprocessableContent);

        const { detail } = data;

        expect(detail).toBeDefined();
        expect(detail).toHaveLength(expectedPaths.length);

        const paths = detail.map((det: any) => det.path[0]);

        expect(paths).toStrictEqual(expect.arrayContaining(expectedPaths));
    });

    test('Vorhandenes Buch aendern, aber ohne Versionsnummer', async () => {
        // given
        const headers = new AxiosHeaders();
        headers.setAuthorization(`${BEARER} ${token}`);

        // when
        const { data, status }: AxiosResponse<ProblemDetails> = await client.put(
            `/${idVorhanden}`,
            geaendertesBuch,
            {
                headers,
            },
        );

        // then
        expect(status).toBe(HttpStatusCode.PreconditionRequired);

        const { detail, statusCode } = data;

        expect(detail).toContain(IF_MATCH);
        expect(statusCode).toBe(HttpStatusCode.PreconditionRequired);
    });

    test('Vorhandenes Buch aendern, aber mit alter Versionsnummer', async () => {
        // given
        const headers = new AxiosHeaders();
        headers.setAuthorization(`${BEARER} ${token}`);
        headers.set(IF_MATCH, '"-1"');

        // when
        const { data, status }: AxiosResponse<ProblemDetails> = await client.put(
            `/${idVorhanden}`,
            veraltesBuch,
            {
                headers,
            },
        );

        // then
        expect(status).toBe(HttpStatusCode.PreconditionFailed);

        const { detail, statusCode } = data;

        expect(detail).toMatch(/Versionsnummer/u);
        expect(statusCode).toBe(HttpStatusCode.PreconditionFailed);
    });

    test('Vorhandenes Buch aendern, aber ohne Token', async () => {
        // given
        const headers = new AxiosHeaders();
        headers.set(IF_MATCH, '"0"');

        // when
        const { status } = await client.put(`/${idVorhanden}`, geaendertesBuch, {
            headers,
        });

        // then
        expect(status).toBe(HttpStatusCode.Unauthorized);
    });

    test('Vorhandenes Buch aendern, aber mit falschem Token', async () => {
        // given
        const headers = new AxiosHeaders();
        headers.setAuthorization(`${BEARER} FALSCHER_TOKEN`);
        headers.set(IF_MATCH, '"0"');

        // when
        const { status } = await client.put(`/${idVorhanden}`, geaendertesBuch, {
            headers,
        });

        // then
        expect(status).toBe(HttpStatusCode.Unauthorized);
    });
});
