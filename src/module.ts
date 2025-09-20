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

import { type ApolloDriverConfig } from '@nestjs/apollo';
import {
    type MiddlewareConsumer,
    Module,
    type NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { AdminModule } from './admin/module.js';
import { BuchModule } from './buch/module.js';
import { BuchController } from './buch/controller/buch-controller.js';
import { BuchWriteController } from './buch/controller/buch-write-controller.js';
import { DevModule } from './config/dev/module.js';
import { graphQlModuleOptions } from './config/graphql.js';
import { LoggerModule } from './logger/module.js';
import { RequestLoggerMiddleware } from './logger/request-logger.js';
import { KeycloakModule } from './security/keycloak/module.js';

@Module({
    imports: [
        AdminModule,
        BuchModule,
        // Umgebungsvariable DATABASE_URL fuer PrismaPg
        ConfigModule,
        DevModule,
        GraphQLModule.forRoot<ApolloDriverConfig>(graphQlModuleOptions),
        LoggerModule,
        KeycloakModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestLoggerMiddleware)
            .forRoutes(BuchController, BuchWriteController, 'auth', 'graphql');
    }
}
