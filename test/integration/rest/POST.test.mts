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
import BigNumber from 'bignumber.js';
import { beforeAll, describe, expect, test } from 'vitest';
import { type BuchDTO } from '../../../src/buch/controller/buch-dto.js';
import { BuchService } from '../../../src/buch/service/buch-service.js';
import {
    APPLICATION_JSON,
    AUTHORIZATION,
    BEARER,
    CONTENT_TYPE,
    LOCATION,
    POST,
    restURL,
} from '../constants.mjs';
import { getToken } from '../token.mjs';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const neuesBuch: Omit<BuchDTO, 'preis' | 'rabatt'> & {
    preis: number;
    rabatt: number;
} = {
    isbn: '978-0-007-00644-1',
    rating: 1,
    art: 'HARDCOVER',
    preis: 99.99,
    rabatt: 0.0123,
    lieferbar: true,
    datum: '2025-02-28T00:00:00Z',
    homepage: 'https://post.rest',
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
    titel: {
        titel: 'Titelpost',
        untertitel: 'untertitelpos',
    },
    abbildungen: [
        {
            beschriftung: 'Abb. 1',
            contentType: 'img/png',
        },
    ],
};
const neuesBuchInvalid: Record<string, unknown> = {
    isbn: 'falsche-ISBN',
    rating: -1,
    art: 'UNSICHTBAR',
    preis: -1,
    rabatt: 2,
    lieferbar: true,
    datum: '12345-123-123',
    homepage: 'anyHomepage',
    titel: {
        titel: '?!',
        untertitel: 'Untertitelinvalid',
    },
};
const neuesBuchIsbnExistiert: BuchDTO = {
    isbn: '978-3-897-22583-1',
    rating: 1,
    art: 'EPUB',
    preis: new BigNumber(99.99),
    rabatt: new BigNumber(0.09),
    lieferbar: true,
    datum: '2025-02-28T00:00:00Z',
    homepage: 'https://post.isbn/',
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
    titel: {
        titel: 'Titelpostisbn',
        untertitel: 'Untertitelpostisbn',
    },
    abbildungen: [],
};

type MessageType = { message: string };

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('POST /rest', () => {
    let token: string;

    beforeAll(async () => {
        token = await getToken('admin', 'p');
    });

    test('Neues Buch', async () => {
        // given
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${token}`);

        // when
        const response = await fetch(restURL, {
            method: POST,
            body: JSON.stringify(neuesBuch),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const responseHeaders = response.headers;
        const location = responseHeaders.get(LOCATION);

        expect(location).toBeDefined();

        // ID nach dem letzten "/"
        const indexLastSlash = location?.lastIndexOf('/') ?? -1;

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location?.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(BuchService.ID_PATTERN.test(idStr ?? '')).toBe(true);
    });

    test('Neues Buch mit ungueltigen Daten', async () => {
        // given
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${token}`);

        const expectedMsg = [
            expect.stringMatching(/^isbn /u),
            expect.stringMatching(/^rating /u),
            expect.stringMatching(/^art /u),
            expect.stringMatching(/^preis /u),
            expect.stringMatching(/^rabatt /u),
            expect.stringMatching(/^datum /u),
            expect.stringMatching(/^homepage /u),
            expect.stringMatching(/^titel.titel /u),
        ];

        // when
        const response = await fetch(restURL, {
            method: POST,
            body: JSON.stringify(neuesBuchInvalid),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.BAD_REQUEST);

        const body = (await response.json()) as MessageType;
        const messages = body.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toStrictEqual(expect.arrayContaining(expectedMsg));
    });

    test('Neues Buch, aber die ISBN existiert bereits', async () => {
        // given
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(AUTHORIZATION, `${BEARER} ${token}`);

        // when
        const response = await fetch(restURL, {
            method: POST,
            body: JSON.stringify(neuesBuchIsbnExistiert),
            headers,
        });

        // then
        const { status } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

        const body = (await response.json()) as MessageType;

        expect(body.message).toStrictEqual(expect.stringContaining('ISBN'));
    });

    test.concurrent('Neues Buch, aber ohne Token', async () => {
        // when
        const { status } = await fetch(restURL, {
            method: POST,
            body: JSON.stringify(neuesBuch),
        });

        // then
        expect(status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test.concurrent('Neues Buch, aber mit falschem Token', async () => {
        // given
        const headers = new Headers();
        headers.append(CONTENT_TYPE, APPLICATION_JSON);
        headers.append(AUTHORIZATION, `${BEARER} FALSCHER_TOKEN`);

        // when
        const { status } = await fetch(restURL, {
            method: POST,
            body: JSON.stringify(neuesBuch),
            headers,
        });

        // then
        expect(status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test.concurrent.todo('Abgelaufener Token');
});
