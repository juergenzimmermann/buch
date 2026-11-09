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
import { type BuchUpdateType } from '../validation/buch-validation.mts';
import { update } from './buch-write-service.mts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const {
    selectMock,
    fromMock,
    whereMock,
    limitMock,
    transactionMock,
    updateMock,
    setMock,
    updateWhereMock,
    returningMock,
} = vi.hoisted(() => {
    return {
        selectMock: vi.fn<(...args: unknown[]) => unknown>(),
        fromMock: vi.fn<(...args: unknown[]) => unknown>(),
        whereMock: vi.fn<(...args: unknown[]) => unknown>(),
        limitMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),

        updateMock: vi.fn<(...args: unknown[]) => unknown>(),
        setMock: vi.fn<(...args: unknown[]) => unknown>(),
        updateWhereMock: vi.fn<(...args: unknown[]) => unknown>(),
        returningMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),

        transactionMock:
            vi.fn<
                (
                    callback: (tx: { update: (...args: unknown[]) => unknown }) => Promise<unknown>,
                ) => Promise<unknown>
            >(),
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

const buch: BuchUpdateType = {
    isbn: '978-0-201-63361-0',
    rating: 5,
    art: 'HARDCOVER',
    preis: 3333,
    rabatt: 0.33,
    lieferbar: true,
    datum: new Date('2026-03-03'),
    homepage: 'https://update.com',
    schlagwoerter: ['JAVASCRIPT'],
};

// oxlint-disable-next-line max-lines-per-function
describe('buch-write-service: update', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        selectMock.mockReturnValue({ from: fromMock });
        fromMock.mockReturnValue({ where: whereMock });
        whereMock.mockReturnValue({ limit: limitMock });

        transactionMock.mockImplementation((transactionBody) =>
            transactionBody({ update: updateMock }),
        );
        updateMock.mockReturnValue({ set: setMock });
        setMock.mockReturnValue({ where: updateWhereMock });
        updateWhereMock.mockReturnValue({ returning: returningMock });
    });

    test('Buch aktualisieren', async () => {
        // given
        const id = 1;
        const versionVorher = '"0"';

        // Mocking der aktuellen Version in der DB
        limitMock.mockResolvedValueOnce([{ version: 0 }]);

        // Mocking der aktualisierten Version nach UPDATE
        returningMock.mockResolvedValueOnce([{ version: 1 }]);

        // when
        const versionNachher = await update(id, buch, versionVorher);

        // then
        expect(versionNachher).toBe(Number.parseInt(versionVorher.slice(1, -1), 10) + 1);
    });

    test('Buch aktualisieren: alte Version', async () => {
        // given
        const id = 1;
        const version = '"0"';

        // Mocking der aktuellen Version in der DB
        limitMock.mockResolvedValueOnce([{ version: 1 }]);

        // when / then
        await expect(update(id, buch, version)).rejects.toThrow(
            `Die Versionsnummer ${version.slice(1, -1)} ist nicht aktuell.`,
        );
    });

    test('Buch aktualisieren: ungueltige Version', async () => {
        // given
        const id = 1;
        const version = '0';

        // when / then
        await expect(update(id, buch, version)).rejects.toThrow(
            `Die Versionsnummer ${version} ist ungueltig`,
        );
    });

    test('Buch aktualisieren: ohne id', async () => {
        // given
        const id = undefined;
        const version = '"0"';

        // when / then
        await expect(update(id as any, buch, version)).rejects.toThrow(
            'Es gibt kein Buch mit der ID undefined',
        );
    });
});
