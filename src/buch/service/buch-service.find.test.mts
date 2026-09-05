// oxlint-disable max-lines-per-function, no-magic-numbers
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

import {
    type BuchMitTitelDTO,
    type BuchMitTitelUndAbbildungen,
    find,
    findAll,
} from './buch-service.mts';
import { Buchart, Prisma, PrismaClient } from '../../generated/prisma/client.ts';
import { describe, expect, test, vi } from 'vitest';
import { type Pageable } from './pageable.mts';
import { type Slice } from './slice.mts';
import { type Suchparameter } from './suchparameter.mts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { findManyMock, countMock } = vi.hoisted(() => {
    return {
        findManyMock: vi.fn<PrismaClient['buch']['findMany']>(),
        countMock: vi.fn<PrismaClient['buch']['count']>(),
    };
});

// vi.mock() bewirkt Hoisting
vi.mock(import('../../config/prisma-client.mts'), () => {
    return {
        prismaClient: {
            buch: {
                findMany: findManyMock,
                count: countMock,
            },
        } as unknown as PrismaClient,
    };
});

const paramsAlle = [undefined, null, {}];

const titel = 'Titel';
const isbn = '978-0-007-00644-1';
const art = 'HARDCOVER';
const rating = 1;
const preisNumber = 1.1;
const lieferbar = true;
const datum = '2026-02-08';
const homepage = 'https://homepage.com';
const buchMock: BuchMitTitelUndAbbildungen = {
    id: 1,
    version: 0,
    isbn,
    rating,
    art: Buchart.HARDCOVER,
    preis: new Prisma.Decimal(preisNumber),
    rabatt: new Prisma.Decimal(0.0123),
    lieferbar,
    datum: new Date(datum),
    homepage,
    schlagwoerter: ['JAVASCRIPT'],
    erzeugt: new Date(datum),
    aktualisiert: new Date(datum),
    titel: {
        id: 11,
        titel,
        untertitel: 'Untertitel',
        buchId: 1,
    },
    abbildungen: [],
};
const { preis, rabatt, ...buchRest } = buchMock;
const buchMockDTO: BuchMitTitelDTO = {
    ...buchRest,
    preis: preis.toNumber(),
    rabatt: rabatt.toNumber(),
};

describe('buch-service: find', () => {
    test.each(paramsAlle)('alle', async (param) => {
        // given
        const pageable: Pageable = { number: 1, size: 5 };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        let result: Readonly<Slice<BuchMitTitelDTO>>;
        if (param === undefined) {
            result = await findAll(pageable);
        } else if (param === null) {
            result = await find(null, pageable);
        } else {
            result = await find({}, pageable);
        }

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('titel vorhanden', async () => {
        // given
        const suchparameter: Suchparameter = { titel };
        const pageable: Pageable = { number: 1, size: 5 };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        const result = await find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('titel nicht vorhanden', async () => {
        // given
        const suchparameter: Suchparameter = { titel };
        const pageable: Pageable = { number: 1, size: 5 };
        findManyMock.mockResolvedValue([]);

        // when / then
        await expect(find(suchparameter, pageable)).rejects.toThrow(/^Keine Buecher gefunden/u);
    });

    test('isbn vorhanden', async () => {
        // given
        const suchparameter: Suchparameter = { isbn };
        const pageable: Pageable = { number: 1, size: 5 };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        const result = await find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('art vorhanden', async () => {
        // given
        const suchparameter: Suchparameter = { art };
        const pageable: Pageable = { number: 1, size: 5 };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        const result = await find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('rating mindestens', async () => {
        // given
        const suchparameter: Suchparameter = { rating };
        const pageable: Pageable = { number: 1, size: 5 };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        const result = await find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('rating keine Zahl', async () => {
        // given
        const suchparameter: Suchparameter = { rating: 'FALSCH' };
        const pageable: Pageable = { number: 1, size: 5 };

        // when / then
        await expect(find(suchparameter, pageable)).rejects.toThrow(/^Ungueltige Suchparameter/u);
    });

    test('preis max', async () => {
        // given
        const suchparameter: Suchparameter = { preis: preisNumber };
        const pageable: Pageable = { number: 1, size: 5 };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        const result = await find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('lieferbar true', async () => {
        // given
        const suchparameter: Suchparameter = { lieferbar };
        const pageable: Pageable = { number: 1, size: 5 };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        const result = await find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('datum', async () => {
        // given
        const suchparameter: Suchparameter = { datum };
        const pageable: Pageable = { number: 1, size: 5 };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        const result = await find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('homepage', async () => {
        // given
        const suchparameter: Suchparameter = { homepage };
        const pageable: Pageable = { number: 1, size: 5 };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        const result = await find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('suchparameter ungueltig', async () => {
        // given
        const suchparameter: any = { ungueltig: 'FALSCH' };
        const pageable: Pageable = { number: 1, size: 5 };
        findManyMock.mockResolvedValue([]);

        // when / then
        await expect(find(suchparameter, pageable)).rejects.toThrow(/^Ungueltige Suchparameter/u);
    });
});
