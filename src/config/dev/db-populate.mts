// Copyright (C) 2026 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul enthält die Funktionalität, um die Test-DB neu zu laden.
 * @packageDocumentation
 */

import { configURL, getConfig } from '../config.mts';
import { type PoolConfig } from 'pg';
import { URL } from 'node:url';
import { db } from '../db.mts';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getLogger } from '../../logger/logger.mts';
import process from 'node:process';
import { readFile } from 'node:fs/promises';
import { sql } from 'drizzle-orm';

const config = await getConfig();

const {
    admin,
    database,
    adminPassword,
    host,
    cert,
    tlsMinVersion,
    tlsMaxVersion,
    poolIdleTimeoutMillis,
    poolConnectionTimeoutMillis,
} = config.db;
const activated = config.db.populate === true;
const { nodeEnv } = config.server;

const connectionAdmin: PoolConfig = {
    user: admin,
    database,
    password: adminPassword,
    host,
    ssl: {
        cert: await readFile(new URL(cert, new URL('..', configURL))),
        minVersion: tlsMinVersion,
        maxVersion: tlsMaxVersion,
    },
    sslnegotiation: 'direct',
    max: 5,
    idleTimeoutMillis: poolIdleTimeoutMillis,
    connectionTimeoutMillis: poolConnectionTimeoutMillis,
};
const drizzleConfigAdmin: any = { connection: connectionAdmin };
if (nodeEnv === 'development') {
    drizzleConfigAdmin.logger = true;
}
export const dbAdmin = drizzle(drizzleConfigAdmin);
const dbURL = new URL('postgresql/', configURL);

const logger = getLogger('populate', 'func');

/**
 * Die Test-DB wird im Development-Modus neu geladen, nachdem die Module
 * initialisiert sind, was durch `OnApplicationBootstrap` realisiert wird.
 */
export const populate = async () => {
    if (!activated) {
        return;
    }

    logger.warn('Die DB wird neu geladen');

    // https://orm.drizzle.team/docs/sql
    const dropScript = new URL('drop-table.sql', dbURL);
    logger.debug('dropScript = %s', dropScript);
    // https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
    const dropStatements = await readFile(dropScript, 'utf8');

    const createScript = new URL('create-table.sql', dbURL);
    logger.debug('createScript = %s', createScript);
    const createStatements = await readFile(createScript, 'utf8');

    const copyScript = new URL('copy-csv.sql', dbURL);
    logger.debug('copyScript = %s', copyScript);
    const copyStatements = await readFile(copyScript, 'utf8');

    try {
        await db.$client.connect();
        await db.transaction(async (tx) => {
            await tx.execute(sql.raw(dropStatements));
            await tx.execute(sql.raw(createStatements));
        });
    } catch (err) {
        logger.error('Fehler beim Neuanlegen der DB-Tabellen.');
        logger.error('Beachte bei Bun: PostgreSQL ist nicht mit TLS nutzbar.');
        logger.error('%o', err as any);
        process.exit();
    }

    // COPY zum Laden von CSV-Dateien erfordert Administrationsrechte
    // https://www.postgresql.org/docs/current/sql-copy.html
    try {
        await dbAdmin.transaction(async (tx) => {
            await tx.execute(sql.raw(copyStatements));
        });
    } catch (err) {
        logger.error('Fehler beim Kopieren der CSV-Dateien.');
        logger.error('%o', err as any);
        process.exit();
    }

    logger.warn('Die DB wurde neu geladen');
};
