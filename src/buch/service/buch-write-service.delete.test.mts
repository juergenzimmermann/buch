// oxlint-disable no-magic-numbers
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

import { Buchart, Prisma, PrismaClient } from '../../generated/prisma/client.ts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type BuchMitTitelUndAbbildungen } from './buch-service.mts';
import { deleteFn } from './buch-write-service.mts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { deleteMock, transactionMock, findUniqueMock } = vi.hoisted(() => {
    return {
        deleteMock: vi.fn<Prisma.BuchDelegate['delete']>(),
        transactionMock: vi.fn<PrismaClient['$transaction']>(),
        findUniqueMock: vi.fn<PrismaClient['buch']['findUnique']>(),
    };
});

// vi.mock() bewirkt Hoisting
vi.mock(import('../../config/prisma-client.mts'), () => {
    return {
        prismaClient: {
            buch: {
                delete: deleteMock,
                findUnique: findUniqueMock,
            },
            $transaction: transactionMock,
        } as unknown as PrismaClient,
    };
});

const id = 50;
const datum = '2026-05-05';
const buch: Readonly<BuchMitTitelUndAbbildungen> = {
    id,
    version: 0,
    isbn: '978-3-824-40481-0',
    rating: 1,
    art: Buchart.HARDCOVER,
    preis: new Prisma.Decimal(55.5),
    rabatt: new Prisma.Decimal(0.055),
    lieferbar: true,
    datum: new Date(datum),
    homepage: 'https://delete.com',
    schlagwoerter: ['JAVASCRIPT'],
    erzeugt: new Date(datum),
    aktualisiert: new Date(datum),
    titel: {
        id: 11,
        titel: 'Titel',
        untertitel: 'Untertitel',
        buchId: 1,
    },
    abbildungen: [],
};

describe('buch-write-service: update', () => {
    beforeEach(() => {
        transactionMock.mockImplementation(
            async (transactionBody: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
                await transactionBody({
                    buch: {
                        delete: deleteMock,
                    },
                } as unknown as Prisma.TransactionClient),
        );
    });

    test('Buch loeschen', async () => {
        // given
        // return von prismaClient.buch.findUnique()
        findUniqueMock.mockResolvedValueOnce(buch);

        // when
        const idResult = await deleteFn(id);

        // then
        expect(idResult).toBe(true);
    });

    test('Buch loeschen: id nicht vorhanden', async () => {
        // given
        // return von prismaClient.buch.findUnique()
        findUniqueMock.mockResolvedValueOnce(null);

        // when
        const idResult = await deleteFn(id);

        // then
        expect(idResult).toBe(false);
    });
});
