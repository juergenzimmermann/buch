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

// Tests mit
//  * Vitest    https://vitest.dev
//  * Jest      https://jestjs.io
//  * Mocha     https://mochajs.org
//  * node:test ab Node 18
//  * bun:test

// fetch aus ES 2015 unterstuetzt nur HTTP 1.1
// https://nodejs.org/docs/latest/api/globals.html#fetch
// https://undici.nodejs.org (undici = 11 auf italienisch)
// https://fetch.spec.whatwg.org

// Alternativen:
//    axios       https://axios-http.com
//    got         https://github.com/sindresorhus/got

import { type AxiosResponse, HttpStatusCode } from 'axios';
import { CONTENT_TYPE, IF_NONE_MATCH } from '../constants.mts';
import { describe, expect, test } from 'vitest';
import { client } from './client.mts';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
// oxlint-disable no-magic-numbers
const ids = [1, 20];
const idNichtVorhanden = 999_999;
const idsETag = [1, 20];
const idFalsch = 'xy';
// oxlint-enable no-magic-numbers

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('GET /rest/:id', () => {
    test.concurrent.each(ids)('Buch zu vorhandener ID %i', async (id) => {
        // given
        // when
        const { data, headers, request, status }: AxiosResponse<{ id: number }> = await client.get(
            `/${id}`,
        );

        // then
        expect(status).toBe(HttpStatusCode.Ok);
        expect(headers[CONTENT_TYPE]).toMatch(/json/iu);
        // ClientHttp2Stream ist ein TypeScript-Interface aus dem Node-Modul '"node:http2'
        expect(request.constructor.name).toBe('ClientHttp2Stream');

        expect(data.id).toBe(id);
    });

    test.concurrent('Kein Buch zu nicht-vorhandener ID', async () => {
        // given
        // when
        const { status } = await client.get(`/${idNichtVorhanden}`);

        // then
        expect(status).toBe(HttpStatusCode.NotFound);
    });

    test.concurrent('Kein Buch zu falscher ID', async () => {
        // given
        // when
        const { status } = await client.get(`/${idFalsch}`);

        // then
        expect(status).toBe(HttpStatusCode.NotFound);
    });

    test.concurrent.each(idsETag)(`Buch zu ID %i mit ${IF_NONE_MATCH}`, async (id) => {
        // given
        // when
        const { data, status } = await client.get(`/${id}`, {
            headers: { [IF_NONE_MATCH]: '"0"' },
        });

        // then
        expect(status).toBe(HttpStatusCode.NotModified);

        expect(data).toBe('');
    });
});
