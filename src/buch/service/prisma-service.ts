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
// along with this program. If not, see <http://www.gnu.org/licenses/>.

// https://docs.nestjs.com/recipes/prisma#use-prisma-client-in-your-nestjs-services
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { getLogger } from '../../logger/logger.js';

// https://docs.nestjs.com/recipes/prisma#use-prisma-client-in-your-nestjs-services
@Injectable()
export class PrismaService implements OnModuleInit {
    // Delegation statt Vererbung: Logging der SQL-Anweisungen kann konfiguriert werden
    readonly client: PrismaClient;

    readonly #logger = getLogger(PrismaService.name);

    constructor() {
        // PrismaClient fuer DB "buch" (siehe Umgebungsvariable DATABASE_URL in ".env")
        // d.h. mit PostgreSQL-User "buch" und Schema "buch"
        const adapter = new PrismaPg({
            connectionString: process.env['DATABASE_URL'],
        });

        if (this.#logger.isLevelEnabled('debug')) {
            const prisma = new PrismaClient({
                adapter,
                errorFormat: 'pretty',
                log: [
                    {
                        emit: 'event',
                        level: 'query',
                    },
                    'info',
                    'warn',
                    'error',
                ],
            });
            prisma.$on('query', (e) => {
                console.log(`Query: ${e.query}`);
            });
            this.client = prisma;
        } else {
            this.client = new PrismaClient({ adapter });
        }
    }

    async onModuleInit() {
        await this.client.$connect();
        this.#logger.info('Verbindung mit der DB ist hergestellt.');
    }
}
