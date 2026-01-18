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

import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { type } from 'node:os';
import { resourcesURL } from './resources.js';

const graphQlURL = new URL('graphql/', resourcesURL);
const schemaGraphQL = new URL('schema.graphql', graphQlURL);
console.debug('schemaGraphQL = %s', schemaGraphQL);

// URL ohne den Praefix "file:///"
const { href } = schemaGraphQL;
const schemaGraphQlPath = type().startsWith('Windows')
    ? href.substring(8)
    : href.substring(7);
console.debug('schemaGraphQlPath = %s', schemaGraphQlPath);

/**
 * Das Konfigurationsobjekt für GraphQL (siehe src\app.module.ts).
 */
export const graphQlModuleOptions: ApolloDriverConfig = {
    typePaths: [schemaGraphQlPath],
    // alternativ: Mercurius (statt Apollo) fuer Fastify (statt Express)
    driver: ApolloDriver,
    playground: false,
    // TODO formatError und logger konfigurieren, damit UserInputError nicht in der Konsole protokolliert wird
};
