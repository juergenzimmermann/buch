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

import { type BuchCreate, create } from './buch-write-service.mts';
import { Prisma, PrismaClient } from '../../generated/prisma/client.ts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Buchart } from '../../generated/prisma/enums.ts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { createMock, countMock, transactionMock, sendmailMock } = vi.hoisted(
    () => {
        return {
            createMock: vi.fn<Prisma.BuchDelegate['create']>(),
            countMock: vi.fn<Prisma.BuchDelegate['count']>(),
            transactionMock: vi.fn(), // oxlint-disable-line vitest/require-mock-type-parameters
            sendmailMock: vi.fn(), // oxlint-disable-line vitest/require-mock-type-parameters
        };
    },
);

// vi.mock() bewirkt Hoisting
vi.mock(import('../../config/prisma-client.mts'), () => {
    return {
        prismaClient: {
            buch: {
                create: createMock,
                count: countMock,
            },
            $transaction: transactionMock,
        } as unknown as PrismaClient,
    };
});

vi.mock(import('../../mail/sendmail.mts'), () => {
    return {
        sendmail: sendmailMock,
    };
});

describe('BuchWriteService create', () => {
    beforeEach(() => {
        createMock.mockReset();
        countMock.mockReset();
        transactionMock.mockReset();
        sendmailMock.mockReset();

        transactionMock.mockImplementation(
            async (
                transactionBody: (
                    tx: Prisma.TransactionClient,
                ) => Promise<unknown>,
            ) =>
                await transactionBody({
                    buch: {
                        create: createMock,
                        count: countMock,
                    },
                } as unknown as Prisma.TransactionClient),
        );
    });

    test('Neues Buch', async () => {
        // given
        const idMock = 1;
        const buch: BuchCreate = {
            isbn: '978-0-007-00644-1',
            rating: 1,
            art: Buchart.HARDCOVER,
            preis: new Prisma.Decimal(1.1),
            rabatt: new Prisma.Decimal(0.0123),
            lieferbar: true,
            datum: new Date(),
            homepage: 'https://post.rest',
            schlagwoerter: ['JAVASCRIPT'],
            titel: {
                create: {
                    titel: 'Titel',
                    untertitel: 'Untertitel',
                },
            },
        };
        const buchTmp: any = { ...buch };
        buchTmp.id = idMock;
        buchTmp.titel.create.id = 11;
        buchTmp.titel.create.buchId = idMock;
        // return von tx.buch.create()
        createMock.mockResolvedValue(buchTmp);
        // sendmail ist eine void-Funktion
        sendmailMock.mockResolvedValue(null);

        // when
        const id = await create(buch);

        // then
        expect(id).toBe(idMock);
        expect(sendmailMock).toHaveBeenCalledOnce();
    });
});
