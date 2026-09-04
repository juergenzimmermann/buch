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

import { type BuchUpdate, update } from './buch-write-service.mts';
import { Buchart, Prisma, PrismaClient } from '../../generated/prisma/client.ts';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { updateMock, transactionMock, findUniqueMock } = vi.hoisted(() => {
    return {
        updateMock: vi.fn<Prisma.BuchDelegate['update']>(),
        transactionMock: vi.fn<PrismaClient['$transaction']>(),
        findUniqueMock: vi.fn<PrismaClient['buch']['findUnique']>(),
    };
});

// vi.mock() bewirkt Hoisting
vi.mock(import('../../config/prisma-client.mts'), () => {
    return {
        prismaClient: {
            buch: {
                update: updateMock,
                findUnique: findUniqueMock,
            },
            $transaction: transactionMock,
        } as unknown as PrismaClient,
    };
});

const buch: BuchUpdate = {
    isbn: '978-0-201-63361-0',
    rating: 5,
    art: Buchart.HARDCOVER,
    preis: new Prisma.Decimal(3333),
    rabatt: new Prisma.Decimal(0.33),
    lieferbar: true,
    datum: new Date('2026-03-03'),
    homepage: 'https://update.com',
    schlagwoerter: ['JAVASCRIPT'],
};

// oxlint-disable-next-line max-lines-per-function
describe('buch-write-service: update', () => {
    beforeEach(() => {
        updateMock.mockReset();
        transactionMock.mockReset();
        findUniqueMock.mockReset();

        transactionMock.mockImplementation(
            async (transactionBody: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
                await transactionBody({
                    buch: {
                        update: updateMock,
                    },
                } as unknown as Prisma.TransactionClient),
        );
    });

    test('Buch aktualisieren', async () => {
        // given
        const id = 1;
        const versionVorher = '"0"';
        const titel = {
            id: 11,
            titel: 'Titel',
            untertitel: 'Untertitel',
            buchId: id,
        };
        const buchFound = { ...buch, id, version: 0, titel };
        const buchUpdated = { ...buch, id, version: 1 };

        // return von prismaClient.buch.findUnique()
        findUniqueMock.mockResolvedValueOnce(buchFound as any);

        // return von tx.buch.update()
        updateMock.mockResolvedValue(buchUpdated as any);

        // when
        const idResult = await update({ id, buch, version: versionVorher });

        // then
        expect(idResult).toBe(id);
    });

    test('Buch aktualisieren: alte Version', async () => {
        // given
        const id = 1;
        const version = '"0"';
        const titel = {
            id: 11,
            titel: 'Titel',
            untertitel: 'Untertitel',
            buchId: id,
        };
        const buchFound = { ...buch, id, version: 1, titel };

        // return von prismaClient.buch.findUnique()
        findUniqueMock.mockResolvedValueOnce(buchFound as any);

        // when / then
        await expect(update({ id, buch, version })).rejects.toThrow(
            `Die Versionsnummer ${version.slice(1, -1)} ist nicht aktuell.`,
        );
    });

    test('Buch aktualisieren: ungueltige Version', async () => {
        // given
        const id = 1;
        const version = '0';

        // when / then
        await expect(update({ id, buch, version })).rejects.toThrow(
            `Die Versionsnummer ${version} ist ungueltig`,
        );
    });

    test('Buch aktualisieren: ohne id', async () => {
        // given
        const id = undefined;
        const version = '"0"';

        // when / then
        await expect(update({ id, buch, version })).rejects.toThrow(
            'Es gibt kein Buch mit der ID undefined',
        );
    });
});
