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
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/module.js';
import { KeycloakModule } from '../security/keycloak/module.js';
import { BuchGetController } from './controller/get.js';
import { BuchWriteController } from './controller/write.js';
import { entities } from './entity/entities.js';
import { BuchMutationResolver } from './resolver/mutation.js';
import { BuchQueryResolver } from './resolver/query.js';
import { BuchReadService } from './service/read.js';
import { BuchWriteService } from './service/write.js';
import { QueryBuilder } from './service/query-builder.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Bücher.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [KeycloakModule, MailModule, TypeOrmModule.forFeature(entities)],
    controllers: [BuchGetController, BuchWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        BuchReadService,
        BuchWriteService,
        BuchQueryResolver,
        BuchMutationResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [BuchReadService, BuchWriteService],
})
export class BuchModule {}
