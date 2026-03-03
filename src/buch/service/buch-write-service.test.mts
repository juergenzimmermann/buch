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
import { Prisma } from '../../generated/prisma/client.ts';
import { Buchart } from '../../generated/prisma/enums.ts';
import { BuchService } from './buch-service.mts';
import { type BuchCreate, BuchWriteService } from './buch-write-service.mts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { createMock, countMock, transactionMock, sendmailMock } = vi.hoisted(
    () => ({
        createMock: vi.fn<Prisma.BuchDelegate['create']>(),
        countMock: vi.fn<Prisma.BuchDelegate['count']>(),
        transactionMock: vi.fn(), // eslint-disable-line vitest/require-mock-type-parameters
        sendmailMock: vi.fn(),
    }),
);

// vi.mock() bewirkt Hoisting
vi.mock('../../config/prisma-client.mts', () => ({
    prismaClient: {
        buch: {
            create: createMock,
            count: countMock,
        },
        $transaction: transactionMock,
    },
}));

vi.mock('../../mail/sendmail.mts', () => ({
    sendmail: sendmailMock,
}));

describe('BuchWriteService create', () => {
    let service: BuchWriteService;
    let readService: BuchService;

    beforeEach(() => {
        readService = new BuchService();
        service = new BuchWriteService(readService);

        createMock.mockReset();
        countMock.mockReset();
        transactionMock.mockReset();
        sendmailMock.mockReset();

        transactionMock.mockImplementation(async (callback) => {
            return callback({
                buch: {
                    create: createMock,
                    count: countMock,
                },
            });
        });
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
        sendmailMock.mockResolvedValue(undefined);

        // when
        const id = await service.create(buch);

        // then
        expect(id).toBe(idMock);
        expect(sendmailMock).toHaveBeenCalledTimes(1);
    });
});
