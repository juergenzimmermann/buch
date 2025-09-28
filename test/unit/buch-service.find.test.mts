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
import {
    type BuchMitTitel,
    BuchService,
} from '../../src/buch/service/buch-service.js';
import { type Pageable } from '../../src/buch/service/pageable.js';
import { PrismaService } from '../../src/buch/service/prisma-service.js';
import { type Suchparameter } from '../../src/buch/service/suchparameter.js';
import { WhereBuilder } from '../../src/buch/service/where-builder.js';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client.js';
import { Buchart } from '../../src/generated/prisma/enums.js';

describe('BuchService find', () => {
    let service: BuchService;
    let prismaServiceMock: PrismaService;

    beforeEach(() => {
        const findManyMock = vi.fn<PrismaClient['buch']['findMany']>();
        const countMock = vi.fn<PrismaClient['buch']['count']>();
        prismaServiceMock = {
            client: {
                buch: {
                    findMany: findManyMock,
                    count: countMock,
                },
            },
        } as any; // cast since we don’t need the full PrismaService here

        const whereBuilder = new WhereBuilder();

        service = new BuchService(prismaServiceMock, whereBuilder);
    });

    test('titel vorhanden', async () => {
        // given
        const titel = 'Titel';
        const suchparameter: Suchparameter = { titel };
        const pageable: Pageable = { number: 1, size: 5 };
        const buchMock: BuchMitTitel = {
            id: 1,
            version: 0,
            isbn: '978-0-007-00644-1',
            rating: 1,
            art: Buchart.HARDCOVER,
            preis: new Prisma.Decimal(1.1),
            rabatt: new Prisma.Decimal(0.0123),
            lieferbar: true,
            datum: new Date(),
            homepage: 'https://post.rest',
            schlagwoerter: ['JAVASCRIPT'],
            erzeugt: new Date(),
            aktualisiert: new Date(),
            titel: {
                id: 11,
                titel: 'Titel',
                untertitel: 'Untertitel',
                buchId: 1,
            },
        };
        (prismaServiceMock.client.buch.findMany as any).mockResolvedValueOnce([
            buchMock,
        ]);
        (prismaServiceMock.client.buch.count as any).mockResolvedValueOnce(1);

        // when
        const result = await service.find(suchparameter, pageable);

        // then
        const { content } = result;

        expect(content).toHaveLength(1);
        expect(content[0]).toStrictEqual(buchMock);
    });

    test('titel nicht vorhanden', async () => {
        // given
        const titel = 'Titel';
        const suchparameter: Suchparameter = { titel };
        const pageable: Pageable = { number: 1, size: 5 };
        (prismaServiceMock.client.buch.findMany as any).mockResolvedValue([]);

        // when / then
        await expect(service.find(suchparameter, pageable)).rejects.toThrow(
            /^Keine Buecher gefunden/,
        );
    });
});
