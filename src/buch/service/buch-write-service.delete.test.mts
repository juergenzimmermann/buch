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
import { deleteFn } from './buch-write-service.mts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { existsByIdMock, deleteMock, deleteWhereMock, returningMock, transactionMock } = vi.hoisted(
    () => {
        return {
            existsByIdMock: vi.fn<(id: number) => Promise<boolean>>(),

            deleteMock: vi.fn<(...args: unknown[]) => unknown>(),
            deleteWhereMock: vi.fn<(...args: unknown[]) => unknown>(),
            returningMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),

            transactionMock:
                vi.fn<
                    (
                        callback: (tx: {
                            delete: (...args: unknown[]) => unknown;
                        }) => Promise<unknown>,
                    ) => Promise<unknown>
                >(),
        };
    },
);

vi.mock(import('./buch-service.mts'), async (importOriginal) => {
    const buchService = await importOriginal();
    return {
        ...buchService,
        existsById: existsByIdMock,
    };
});

// vi.mock() bewirkt Hoisting
vi.mock(import('../../config/db.mts'), () => {
    return {
        db: {
            transaction: transactionMock,
        } as unknown as typeof import('../../config/db.mts').db,
    };
});

const id = 50;

describe('buch-write-service: delete', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        transactionMock.mockImplementation((transactionBody) =>
            transactionBody({ delete: deleteMock }),
        );
        deleteMock.mockReturnValue({ where: deleteWhereMock });
        deleteWhereMock.mockReturnValue({ returning: returningMock });
    });

    test('Buch loeschen', async () => {
        // given
        // Mocking, dass das Buch mit der id 1 existiert und in einer Transaktion geloescht wird
        existsByIdMock.mockResolvedValueOnce(true);
        returningMock.mockResolvedValueOnce([{ id }]);

        // when
        const deleteResult = await deleteFn(id);

        // then
        expect(deleteResult).toBe(true);
    });

    test('Buch loeschen: id nicht vorhanden', async () => {
        // given
        // Mocking, dass das Buch mit der id 1 nicht existiert
        existsByIdMock.mockResolvedValueOnce(false);

        // when
        const deleteResult = await deleteFn(id);

        // then
        expect(deleteResult).toBe(false);
    });
});
