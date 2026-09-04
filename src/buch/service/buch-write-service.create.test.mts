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
import { Buchart, Prisma, PrismaClient } from '../../generated/prisma/client.ts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { IsbnExistsError } from './errors.mts';
import type Mail from 'nodemailer/lib/mailer/index.d.ts';
import { type createTransport } from 'nodemailer';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { createMock, countMock, transactionMock, createTransportMock, sendMailMock } = vi.hoisted(
    () => {
        return {
            createMock: vi.fn<Prisma.BuchDelegate['create']>(),
            countMock: vi.fn<Prisma.BuchDelegate['count']>(),
            transactionMock: vi.fn<PrismaClient['$transaction']>(),
            createTransportMock: vi.fn<typeof createTransport>(),
            sendMailMock: vi.fn<Mail['sendMail']>(),
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

vi.mock(import('nodemailer'), () => {
    return {
        createTransport: createTransportMock as unknown as typeof createTransport,
    };
});

const buch: BuchCreate = {
    isbn: '978-0-007-00644-1',
    rating: 1,
    art: Buchart.HARDCOVER,
    preis: new Prisma.Decimal(1.1),
    rabatt: new Prisma.Decimal(0.0123),
    lieferbar: true,
    datum: new Date(),
    homepage: 'https://create.com',
    schlagwoerter: ['JAVASCRIPT'],
    titel: {
        create: {
            titel: 'Titel',
            untertitel: 'Untertitel',
        },
    },
};

describe('buch-write-service: create', () => {
    beforeEach(() => {
        createMock.mockReset();
        countMock.mockReset();
        transactionMock.mockReset();
        createTransportMock.mockReset();
        sendMailMock.mockReset();

        transactionMock.mockImplementation(
            async (transactionBody: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
                await transactionBody({
                    buch: {
                        create: createMock,
                        count: countMock,
                    },
                } as unknown as Prisma.TransactionClient),
        );
        createTransportMock.mockReturnValue({ sendMail: sendMailMock } as unknown as ReturnType<
            typeof createTransport
        >);
    });

    test('Neues Buch', async () => {
        // given
        const idMock = 1;
        const buchTmp: any = { ...buch };
        buchTmp.id = idMock;
        buchTmp.titel.create.id = 11;
        buchTmp.titel.create.buchId = idMock;

        // return von tx.buch.create()
        createMock.mockResolvedValue(buchTmp);
        // sendMail ist eine void-Funktion
        sendMailMock.mockResolvedValue(null);

        // when
        const id = await create(buch);

        // then
        expect(id).toBe(idMock);
        expect(sendMailMock).toHaveBeenCalledOnce();
    });

    test('Neues Buch: ISBN bereits vorhanden', async () => {
        // given
        // return von prismaClient.buch.count({ where: { isbn } }) liefert 1
        countMock.mockResolvedValueOnce(1);

        // when / then
        await expect(create(buch)).rejects.toBeInstanceOf(IsbnExistsError);
        expect(transactionMock).not.toHaveBeenCalled();
        expect(sendMailMock).not.toHaveBeenCalled();
    });
});
