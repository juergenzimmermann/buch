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

// some.service.spec.ts
import { Test } from '@nestjs/testing';
import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import {
    type PrismaClient,
    Prisma,
} from '../../src/generated/prisma/client.js';
import { Buchart } from '../../src/generated/prisma/enums.js';
import { PrismaService } from '../../src/buch/service/prisma-service.js';
import {
    type BuchMitTitel,
    BuchService,
} from '../../src/buch/service/buch-service.js';

describe('BuchService Unit findById', () => {
    let service: BuchService;
    let prismaClientMock: DeepMockProxy<PrismaClient>;
    const prismaServiceMockProvider = {
        provide: PrismaService,
        useValue: {
            client: undefined as unknown as DeepMockProxy<PrismaClient>,
        },
    };

    beforeEach(async () => {
        prismaClientMock = mockDeep<PrismaClient>();
        prismaServiceMockProvider.useValue.client = prismaClientMock;

        const moduleRef = await Test.createTestingModule({
            providers: [BuchService, prismaServiceMockProvider],
        }).compile();

        service = moduleRef.get(BuchService);
    });

    afterEach(() => {
        mockReset(prismaClientMock);
        vi.restoreAllMocks();
    });

    test('findById vorhanden', async () => {
        const id = 1;
        const buch: BuchMitTitel = {
            id,
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
                buchId: id,
            },
        };
        prismaClientMock.buch.findUnique.mockResolvedValueOnce(buch);

        await expect(service.findById({ id })).resolves.toStrictEqual(buch);
    });
});
