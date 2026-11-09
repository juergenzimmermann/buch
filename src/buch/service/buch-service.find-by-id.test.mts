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

import { BuchDTO, type BuchSelect } from './buch-dto.mts';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type TitelSelect } from './titel-dto.mts';
import { findById } from './buch-service.mts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { selectMock, fromMock, innerJoinMock, whereMock, limitMock } = vi.hoisted(() => {
    return {
        selectMock: vi.fn<(...args: unknown[]) => unknown>(),
        fromMock: vi.fn<(...args: unknown[]) => unknown>(),
        innerJoinMock: vi.fn<(...args: unknown[]) => unknown>(),
        whereMock: vi.fn<(...args: unknown[]) => unknown>(),
        limitMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
});

// vi.mock() bewirkt Hoisting
vi.mock(import('../../config/db.mts'), () => {
    return {
        db: {
            select: selectMock,
        } as unknown as typeof import('../../config/db.mts').db,
    };
});

describe('buch-service: findById', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mocking der Drizzle-Abfrage mit dem Ergebnis des Inner Joins
        selectMock.mockReturnValue({ from: fromMock });
        fromMock.mockReturnValue({ innerJoin: innerJoinMock });
        innerJoinMock.mockReturnValue({ where: whereMock });
        whereMock.mockReturnValue({ limit: limitMock });
    });

    test('id vorhanden', async () => {
        // given
        const id = 1;
        const buchSelectMock: Readonly<BuchSelect> = {
            id,
            version: 0,
            isbn: '978-0-007-00644-1',
            rating: 1,
            art: 'HARDCOVER',
            preis: '1.1',
            rabatt: '0.0123',
            lieferbar: true,
            datum: new Date(),
            homepage: 'https://post.rest',
            schlagwoerter: ['JAVASCRIPT'],
            erzeugt: new Date(),
            aktualisiert: new Date(),
        };
        const titelSelectMock: Readonly<TitelSelect> = {
            id: 11,
            titel: 'Titel',
            untertitel: 'Untertitel',
            buchId: id,
        };
        const expectedBuchDTO: BuchDTO = new BuchDTO(buchSelectMock, titelSelectMock);

        // Mocking der Drizzle-Abfrage
        limitMock.mockResolvedValueOnce([{ buch: buchSelectMock, titel: titelSelectMock }]);

        // when
        const actualBuchDTO = await findById(id);

        // then
        expect(actualBuchDTO).toStrictEqual(expectedBuchDTO);
        expect(innerJoinMock).toHaveBeenCalledOnce();
        expect(limitMock).toHaveBeenCalledWith(1);
    });

    test('id nicht vorhanden', async () => {
        // given
        const id = 999;

        // Mocking der Drizzle-Abfrage
        limitMock.mockResolvedValueOnce([]);

        // when / then
        await expect(findById(id)).rejects.toThrow(`Es gibt kein Buch mit der ID ${id}.`);
    });
});
