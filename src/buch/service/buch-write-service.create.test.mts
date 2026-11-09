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
import { type BuchNeuType } from '../validation/buch-validation.mts';
import { IsbnExistsError } from './errors.mts';
import type Mail from 'nodemailer/lib/mailer/index.d.ts';
import { type createTransport } from 'nodemailer';
import { insert } from './buch-write-service.mts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const {
    selectMock,
    fromMock,
    whereMock,
    limitMock,
    insertMock,
    valuesMock,
    returningMock,
    transactionMock,
    createTransportMock,
    sendMailMock,
} = vi.hoisted(() => {
    return {
        selectMock: vi.fn<(...args: unknown[]) => unknown>(),
        fromMock: vi.fn<(...args: unknown[]) => unknown>(),
        whereMock: vi.fn<(...args: unknown[]) => unknown>(),
        limitMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),

        insertMock: vi.fn<(...args: unknown[]) => unknown>(),
        valuesMock: vi.fn<(...args: unknown[]) => unknown>(),
        returningMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),

        transactionMock:
            vi.fn<
                (
                    callback: (tx: { insert: (...args: unknown[]) => unknown }) => Promise<unknown>,
                ) => Promise<unknown>
            >(),

        createTransportMock: vi.fn<typeof createTransport>(),
        sendMailMock: vi.fn<Mail['sendMail']>(),
    };
});

// vi.mock() bewirkt Hoisting
vi.mock(import('../../config/db.mts'), () => {
    return {
        db: {
            select: selectMock,
            transaction: transactionMock,
        } as unknown as typeof import('../../config/db.mts').db,
    };
});

vi.mock(import('nodemailer'), () => {
    return {
        createTransport: createTransportMock as unknown as typeof createTransport,
    };
});

const buch: BuchNeuType = {
    isbn: '978-0-007-00644-1',
    rating: 1,
    art: 'HARDCOVER',
    preis: 1.1,
    rabatt: 0.0123,
    lieferbar: true,
    datum: new Date(),
    homepage: 'https://create.com',
    schlagwoerter: ['JAVASCRIPT'],
    titel: {
        titel: 'Titel',
        untertitel: 'Untertitel',
    },
};

describe('buch-write-service: create', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        selectMock.mockReturnValue({ from: fromMock });
        fromMock.mockReturnValue({ where: whereMock });
        whereMock.mockReturnValue({ limit: limitMock });
        limitMock.mockResolvedValue([]);

        transactionMock.mockImplementation((transactionBody) =>
            transactionBody({ insert: insertMock }),
        );
        insertMock.mockReturnValue({ values: valuesMock });
        valuesMock.mockReturnValue({ returning: returningMock });

        createTransportMock.mockReturnValue({ sendMail: sendMailMock } as unknown as ReturnType<
            typeof createTransport
        >);
    });

    test('Neues Buch', async () => {
        // given
        const idMock = 1;

        // Mocking der generierten IDs in den Tabellen "buch" und "titel"
        returningMock.mockResolvedValueOnce([{ id: idMock }]).mockResolvedValueOnce([{ id: 11 }]);

        // sendMail ist eine void-Funktion
        sendMailMock.mockResolvedValue(null);

        // when
        const id = await insert(buch);

        // then
        expect(id).toBe(idMock);
        expect(sendMailMock).toHaveBeenCalledOnce();
    });

    test('Neues Buch: ISBN bereits vorhanden', async () => {
        // given
        // Mocking fuer die Suche mit ISBN: Buch mit id 1 gefunden
        limitMock.mockResolvedValue([{ id: 1 }]);

        // when / then
        await expect(insert(buch)).rejects.toBeInstanceOf(IsbnExistsError);
        expect(transactionMock).not.toHaveBeenCalled();
        expect(sendMailMock).not.toHaveBeenCalled();
    });
});
