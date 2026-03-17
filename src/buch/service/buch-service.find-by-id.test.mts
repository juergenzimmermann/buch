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

// Hoisting: wird an den (Datei-) Anfang verschoben
const { findUniqueMock } = vi.hoisted(() => ({
    findUniqueMock: vi.fn<PrismaClient['buch']['findUnique']>(),
}));

// vi.mock() bewirkt Hoisting
vi.mock('../../config/prisma-client.mts', () => ({
    prismaClient: {
        buch: {
            findUnique: findUniqueMock,
        },
    },
}));

describe('BuchService findById', () => {
    let service: BuchService;

    beforeEach(() => {
        service = new BuchService();
        findUniqueMock.mockReset();
    });

    test('id vorhanden', async () => {
        // given
        const id = 1;
        const buchMock: Readonly<BuchMitTitelUndAbbildungen> = {
            id,
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
                buchId: id,
            },
            abbildungen: [],
        };
        // return von prismaClient.buch.findUnique()
        findUniqueMock.mockResolvedValueOnce(buchMock);

        // when
        const buch = await service.findById({ id });

        // then
        expect(buch).toStrictEqual(buchMock);
    });

    test('id nicht vorhanden', async () => {
        // given
        const id = 999;
        findUniqueMock.mockResolvedValue(null);

        // when / then
        await expect(service.findById({ id })).rejects.toThrow(
            `Es gibt kein Buch mit der ID ${id}.`,
        );
    });
});
