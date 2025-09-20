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

import { nodeConfig } from '../../src/config/node.js';
import { paths } from '../../src/config/paths.js';

const { host, port } = nodeConfig;

export const baseURL = `https://${host}:${port}`;
export const restURL = `${baseURL}/rest`;
export const graphqlURL = `${baseURL}/graphql`;

export const tokenPath = `${paths.auth}/${paths.token}`;

export const POST = 'POST';
export const PUT = 'PUT';
export const DELETE = 'DELETE';

export const ACCEPT = 'Accept';
export const CONTENT_TYPE = 'Content-Type';
export const LOCATION = 'location';
export const IF_NONE_MATCH = 'If-None-Match';
export const IF_MATCH = 'If-Match';
export const AUTHORIZATION = 'Authorization';

export const APPLICATION_JSON = 'application/json';
export const X_WWW_FORM_URL_ENCODED = 'application/x-www-form-urlencoded';
export const GRAPHQL_RESPONSE_JSON = 'application/graphql-response+json';
export const BEARER = 'Bearer';
