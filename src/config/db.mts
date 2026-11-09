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

import { configURL, getConfig } from './config.mts';
import { type PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getLogger } from '../logger/logger.mts';
import { readFile } from 'node:fs/promises';

/**
 * Das Modul besteht aus dem Objekt {@linkcode prismaClient} als DB-Client
 * mit _Prisma_.
 * @packageDocumentation
 */

const logger = getLogger('config/prisma-client');

const config = await getConfig();
const {
    user,
    database,
    password,
    host,
    cert,
    tlsMinVersion,
    tlsMaxVersion,
    poolMax,
    poolIdleTimeoutMillis,
    poolConnectionTimeoutMillis,
} = config.db;
const { nodeEnv } = config.server;

const connection: PoolConfig = {
    user,
    database,
    password,
    host,
    ssl: {
        cert: await readFile(new URL(cert, new URL('..', configURL))),
        minVersion: tlsMinVersion,
        maxVersion: tlsMaxVersion,
    },
    sslnegotiation: 'direct',
    // Connection Pool
    max: poolMax,
    idleTimeoutMillis: poolIdleTimeoutMillis, // Timeout, wie lange eine Verbindung inaktive ist, bevor sie geschlossen wird
    connectionTimeoutMillis: poolConnectionTimeoutMillis, // Timeout fuer Aufbau der DB-Verbindung
};
const drizzleConfig: any = { connection };
if (nodeEnv === 'development') {
    drizzleConfig.logger = true;
}
export const db = drizzle(drizzleConfig);

/**
 * DB-Verbindung für den Drizzle-Client trennen.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const disconnectDB = async () => {
    await db.$client.end();
    logger.info('Verbindung mit der DB ist getrennt.');
};
