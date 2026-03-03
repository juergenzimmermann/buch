// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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

/**
 * Das Modul enthält die Konfiguration für den _Bun_-basierten Server.
 * @packageDocumentation
 *
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */

import { readFile } from 'node:fs/promises';
import { hostname } from 'node:os';
import { URL } from 'node:url';
import { getLogger } from '../logger/logger.mts';
import { config } from './app.mts';
import { env } from './env.mts';
import { resourcesURL } from './resources.mts';

const logger = getLogger('config/server', 'file');

const { NODE_ENV } = env;

const computername = hostname();
const { server } = config;
if (
    server !== undefined &&
    ((server.port !== undefined && typeof server.port !== 'number') ||
        (server.portHttp !== undefined && typeof server.portHttp !== 'number'))
) {
    throw new TypeError('Ein konfigurierter Port ist keine Zahl');
}
// "Optional Chaining" und "Nullish Coalescing" ab ES2020
const port = (server?.port as number | undefined) ?? 3000; // eslint-disable-line @typescript-eslint/no-magic-numbers
logger.debug('port = %d', port);
const portHttp = (server?.portHttp as number | undefined) ?? 3030; // eslint-disable-line @typescript-eslint/no-magic-numbers
logger.debug('portHttp = %d', portHttp);

// https://nodejs.org/api/fs.html
const tlsURL = new URL('tls/', resourcesURL);
logger.debug('tlsURL = %s', tlsURL);

// public/private keys und Zertifikat fuer TLS
const key = await readFile(new URL('key.pem', tlsURL), { encoding: 'utf8' }); // eslint-disable-line security/detect-non-literal-fs-filename
const cert = await readFile(new URL('certificate.crt', tlsURL), {
    encoding: 'utf8',
});

export type NodeEnv =
    | 'development'
    | 'PRODUCTION'
    | 'production'
    | 'test'
    | undefined;
/**
 * Die Konfiguration für den _Node_-basierten Server:
 * - Rechnername
 * - IP-Adresse
 * - Port
 * - `PEM`- und Zertifikat-Datei mit dem öffentlichen und privaten Schlüssel
 *   für TLS
 */
// "as const" fuer readonly
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions
type ServerConfig = {
    host: string;
    port: number;
    portHttp: number;
    key: string;
    cert: string;
    nodeEnv: NodeEnv;
};
export const serverConfig: ServerConfig = {
    host: computername,
    // Shorthand Property ab ES 2015
    port,
    portHttp,
    key,
    cert,
    nodeEnv: NODE_ENV as NodeEnv,
} as const;
