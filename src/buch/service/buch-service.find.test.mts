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

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Prisma, PrismaClient } from '../../generated/prisma/client.ts';
import { Buchart } from '../../generated/prisma/enums.ts';
import {
    type BuchMitTitelUndAbbildungen,
    BuchService,
} from './buch-service.mts';
import { type Pageable } from './pageable.mts';
import { type Suchparameter } from './suchparameter.mts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { findManyMock, countMock } = vi.hoisted(() => ({
    findManyMock: vi.fn<PrismaClient['buch']['findMany']>(),
    countMock: vi.fn<PrismaClient['buch']['count']>(),
}));

// vi.mock() bewirkt Hoisting
vi.mock('../../config/prisma-client.mts', () => ({
    prismaClient: {
        buch: {
            findMany: findManyMock,
            count: countMock,
        },
    },
}));

describe('BuchService find', () => {
    let service: BuchService;

    beforeEach(() => {
        service = new BuchService();
        findManyMock.mockReset();
        countMock.mockReset();
    });

    test('titel vorhanden', async () => {
        // given
        const titel = 'Titel';
        const suchparameter: Suchparameter = { titel };
        const pageable: Pageable = { number: 1, size: 5 };
        const buchMock: BuchMitTitelUndAbbildungen = {
            id: 1,
            version: 0,
            isbn: '978-0-007-00644-1',
            rating: 1,
            art: Buchart.HARDCOVER,
            preis: new Prisma.Decimal(1.1),
            rabatt: new Prisma.Decimal(0.0123),
            lieferbar: true,
            datum: new Date(),
            homepage: 'https://post.rest',
            schlagwoerter: ['JAVASCRIPT'],
            erzeugt: new Date(),
            aktualisiert: new Date(),
            titel: {
                id: 11,
                titel: 'Titel',
                untertitel: 'Untertitel',
                buchId: 1,
            },
            abbildungen: [],
        };
        // return von prismaClient.buch.findMany()
        findManyMock.mockResolvedValueOnce([buchMock]);
        // return von prismaClient.buch.count()
        countMock.mockResolvedValueOnce(1);

        // when
        const result = await service.find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMock);
    });

    test('titel nicht vorhanden', async () => {
        // given
        const titel = 'Titel';
        const suchparameter: Suchparameter = { titel };
        const pageable: Pageable = { number: 1, size: 5 };
        findManyMock.mockResolvedValue([]);

        // when / then
        await expect(
            service.find(suchparameter, pageable),
        ).rejects.toThrowError(/^Keine Buecher gefunden/);
    });
});
