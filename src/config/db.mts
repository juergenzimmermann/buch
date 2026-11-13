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
import { relations } from '../db/relations.mts';

/**
 * Das Modul enthält das Objekt {@linkcode db} als DB-Client mit _Drizzle_.
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
    log,
} = config.db;
const { nodeEnv, runtime } = config.server;

// Bun ohne TLS
const connection: PoolConfig =
    runtime === 'Bun'
        ? {
              user,
              database,
              password,
              host,
              max: poolMax,
              idleTimeoutMillis: poolIdleTimeoutMillis,
              connectionTimeoutMillis: poolConnectionTimeoutMillis,
          }
        : {
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
const useLogger = log === true && (nodeEnv === 'development' || nodeEnv === 'test');
export const db = drizzle({
    connection,
    relations,
    logger: useLogger,
});

/**
 * DB-Verbindung für den Drizzle-Client trennen.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const disconnectDB = async () => {
    await db.$client.end();
    logger.info('Verbindung mit der DB ist getrennt.');
};
