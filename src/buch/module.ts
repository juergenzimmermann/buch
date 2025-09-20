// Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { Module } from '@nestjs/common';
import { MailModule } from '../mail/module.js';
import { KeycloakModule } from '../security/keycloak/module.js';
import { BuchController } from './controller/buch-controller.js';
import { BuchWriteController } from './controller/buch-write-controller.js';
import { BuchMutationResolver } from './resolver/mutation.js';
import { BuchQueryResolver } from './resolver/query.js';
import { BuchService } from './service/buch-service.js';
import { BuchWriteService } from './service/buch-write-service.js';
import { PrismaService } from './service/prisma-service.js';
import { WhereBuilder } from './service/where-builder.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Bücher.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für Prisma.
 */
@Module({
    imports: [KeycloakModule, MailModule],
    controllers: [BuchController, BuchWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        BuchService,
        BuchWriteService,
        BuchQueryResolver,
        BuchMutationResolver,
        PrismaService,
        WhereBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [BuchService, BuchWriteService],
})
export class BuchModule {}
