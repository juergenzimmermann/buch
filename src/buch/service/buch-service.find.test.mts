// oxlint-disable max-lines
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

import { BuchDTO, type BuchSelect } from './buchDTO.mts';
import { describe, expect, test, vi } from 'vitest';
import { find, findAll } from './buch-service.mts';
import { type Pageable } from './pageable.mts';
import { type Suchparameter } from './suchparameter.mts';
import { type TitelSelect } from './titelDTO.mts';

// Hoisting: wird an den (Datei-) Anfang verschoben
const { selectMock, fromMock, innerJoinMock, whereMock, offsetMock, limitMock } = vi.hoisted(() => {
    return {
        selectMock: vi.fn<(...args: unknown[]) => unknown>(),
        fromMock: vi.fn<(...args: unknown[]) => unknown>(),
        innerJoinMock: vi.fn<(...args: unknown[]) => unknown>(),
        whereMock: vi.fn<(...args: unknown[]) => unknown>(),
        offsetMock: vi.fn<(...args: unknown[]) => unknown>(),
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

const titel = 'Titel';
const isbn = '978-0-007-00644-1';
const art = 'HARDCOVER';
const rating = 1;
const preis = '1.1';
const rabatt = '0.123';
const lieferbar = true;
const datum = '2026-02-08';
const homepage = 'https://homepage.com';
const buchSelectMock: Readonly<BuchSelect> = {
    id: 1,
    version: 0,
    isbn,
    rating,
    art,
    preis,
    rabatt,
    lieferbar,
    datum: new Date(datum),
    homepage,
    schlagwoerter: ['JAVASCRIPT'],
    erzeugt: new Date(datum),
    aktualisiert: new Date(datum),
};
const titelSelectMock: Readonly<TitelSelect> = {
    id: 11,
    titel,
    untertitel: 'Untertitel',
    buchId: 1,
};

const buchMockDTO = new BuchDTO(buchSelectMock, titelSelectMock);

const mockDrizzleQuery = () => {
    selectMock.mockReturnValueOnce({ from: fromMock }).mockReturnValueOnce({ from: fromMock });
    fromMock.mockReturnValue({ innerJoin: innerJoinMock });
    innerJoinMock.mockReturnValue({ where: whereMock });
    whereMock.mockReturnValueOnce({ offset: offsetMock }).mockResolvedValueOnce([{ count: 1 }]);
    offsetMock.mockReturnValue({ limit: limitMock });
    limitMock.mockResolvedValueOnce([{ buch: buchSelectMock, titel: titelSelectMock }]);
};

const mockDrizzleQueryNotFound = () => {
    selectMock.mockReturnValueOnce({ from: fromMock });
    fromMock.mockReturnValue({ innerJoin: innerJoinMock });
    innerJoinMock.mockReturnValue({ where: whereMock });
    whereMock.mockReturnValueOnce({ offset: offsetMock });
    offsetMock.mockReturnValue({ limit: limitMock });
    limitMock.mockResolvedValueOnce([]);
};

// oxlint-disable-next-line max-lines-per-function
describe('buch-service: find', () => {
    test('findAll', async () => {
        // given
        const pageable: Pageable = { number: 1, size: 5 };

        // Mocking der Drizzle-Query
        selectMock.mockReturnValue({ from: fromMock });
        fromMock.mockReturnValue({ innerJoin: innerJoinMock });
        innerJoinMock.mockReturnValue({ offset: offsetMock });
        offsetMock.mockReturnValue({ limit: limitMock });
        limitMock.mockResolvedValueOnce([{ buch: buchSelectMock, titel: titelSelectMock }]);

        // when
        const result = await findAll(pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('find ohne WHERE', async () => {
        // given
        const pageable: Pageable = { number: 1, size: 5 };

        // Mocking der Drizzle-Query
        selectMock.mockReturnValue({ from: fromMock });
        fromMock.mockReturnValue({ innerJoin: innerJoinMock });
        innerJoinMock.mockReturnValue({ offset: offsetMock });
        offsetMock.mockReturnValue({ limit: limitMock });
        limitMock.mockResolvedValueOnce([{ buch: buchSelectMock, titel: titelSelectMock }]);

        // when
        const result = await find({}, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
    });

    test('titel vorhanden', async () => {
        // given
        const suchparameter: Suchparameter = { titel };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQuery();

        // when
        const result = await find(suchparameter as Record<string, string>, pageable);

        // then
        const { content, totalElements } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
        expect(totalElements).toBe(1);
    });

    test('titel nicht vorhanden', async () => {
        // given
        const suchparameter: Suchparameter = { titel };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQueryNotFound();

        // when / then
        await expect(find(suchparameter as Record<string, string>, pageable)).rejects.toThrow(
            /^Keine Buecher gefunden/u,
        );
    });

    test('isbn vorhanden', async () => {
        // given
        const suchparameter: Suchparameter = { isbn };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQuery();

        // when
        const result = await find(suchparameter as Record<string, string>, pageable);

        // then
        const { content, totalElements } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
        expect(totalElements).toBe(1);
    });

    test('isbn nicht vorhanden', async () => {
        // given
        const suchparameter: Suchparameter = { isbn };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQueryNotFound();

        // when / then
        await expect(find(suchparameter as Record<string, string>, pageable)).rejects.toThrow(
            /^Keine Buecher gefunden/u,
        );
    });

    test('art vorhanden', async () => {
        // given
        const suchparameter: Suchparameter = { art };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQuery();

        // when
        const result = await find(suchparameter as Record<string, string>, pageable);

        // then
        const { content, totalElements } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
        expect(totalElements).toBe(1);
    });

    test('rating mindestens', async () => {
        // given
        const suchparameter: Suchparameter = { rating };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQuery();

        // when
        const result = await find(suchparameter as Record<string, string>, pageable);

        // then
        const { content, totalElements } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
        expect(totalElements).toBe(1);
    });

    test('rating keine Zahl', async () => {
        // given
        const suchparameter: Suchparameter = { rating: 'FALSCH' };
        const pageable: Pageable = { number: 1, size: 5 };

        // when / then
        await expect(find(suchparameter as Record<string, string>, pageable)).rejects.toThrow(
            /^Ungueltige Suchparameter/u,
        );
    });

    test('preis max', async () => {
        // given
        const suchparameter: Suchparameter = { preis: Number.parseInt(preis, 10) };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQuery();

        // when
        const result = await find(suchparameter as Record<string, string>, pageable);

        // then
        const { content, totalElements } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
        expect(totalElements).toBe(1);
    });

    test('lieferbar true', async () => {
        // given
        const suchparameter: Suchparameter = { lieferbar };
        const pageable: Pageable = { number: 1, size: 5 };

        // Mocking der Drizzle-Query
        selectMock.mockReturnValueOnce({ from: fromMock }).mockReturnValueOnce({ from: fromMock });
        fromMock.mockReturnValue({ innerJoin: innerJoinMock });
        innerJoinMock.mockReturnValue({ where: whereMock });
        whereMock.mockReturnValueOnce({ offset: offsetMock }).mockResolvedValueOnce([{ count: 1 }]);
        offsetMock.mockReturnValue({ limit: limitMock });
        limitMock.mockResolvedValueOnce([{ buch: buchSelectMock, titel: titelSelectMock }]);

        // when
        const result = await find(suchparameter as Record<string, string>, pageable);

        // then
        const { content, totalElements } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
        expect(totalElements).toBe(1);
    });

    test('datum', async () => {
        // given
        const suchparameter: Suchparameter = { datum };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQuery();

        // when
        const result = await find(suchparameter as Record<string, string>, pageable);

        // then
        const { content, totalElements } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
        expect(totalElements).toBe(1);
    });

    test('homepage', async () => {
        // given
        const suchparameter: Suchparameter = { homepage };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQuery();

        // when
        const result = await find(suchparameter as Record<string, string>, pageable);

        // then
        const { content, totalElements } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMockDTO);
        expect(totalElements).toBe(1);
    });

    test('suchparameter ungueltig', async () => {
        // given
        const suchparameter: any = { ungueltig: 'FALSCH' };
        const pageable: Pageable = { number: 1, size: 5 };

        mockDrizzleQuery();

        // when / then
        await expect(find(suchparameter, pageable)).rejects.toThrow(/^Ungueltige Suchparameter/u);
    });
});
