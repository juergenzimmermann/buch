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

import { Agent } from 'node:https';
import path from 'node:path';
import {
    HttpStatus,
    type INestApplication,
    ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { down, exec, upAll } from 'docker-compose';
import isPortReachable from 'is-port-reachable';
import { AppModule } from '../src/app.module.js';
import { config } from '../src/config/app.js';
import { dbType } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { nodeConfig } from '../src/config/node.js';
import { paths } from '../src/config/paths.js';
import { typeOrmModuleOptions } from '../src/config/typeormOptions.js';

export const tokenPath = `${paths.auth}/${paths.token}`;
export const refreshPath = `${paths.auth}/${paths.refresh}`;

export const { host, port } = nodeConfig;

const { httpsOptions } = nodeConfig;

const dbPort: number = (typeOrmModuleOptions as any).port as number;
// Verzeichnis mit compose.yml ausgehend vom Wurzelverzeichnis
const dockerComposeDir = path.join('.extras', 'compose');

let dbHealthCheck: string;
switch (dbType) {
    case 'postgres': {
        dbHealthCheck = 'until pg_isready; do sleep 1; done';
        break;
    }
    case 'mysql': {
        dbHealthCheck = 'until healthcheck.sh; do sleep 1; done';
        break;
    }
    case 'oracle': {
        dbHealthCheck = 'until ping; do sleep 1; done';
        break;
    }
    // 'better-sqlite3' erfordert Python zum Uebersetzen, wenn das Docker-Image gebaut wird
    case 'sqlite': {
        dbHealthCheck = '';
        break;
    }
}

// -----------------------------------------------------------------------------
// D B - S e r v e r   m i t   D o c k e r   C o m p o s e
// -----------------------------------------------------------------------------
const startDbServer = async () => {
    // 'better-sqlite3' erfordert Python zum Uebersetzen, wenn das Docker-Image gebaut wird
    if (dbType === 'sqlite') {
        return;
    }
    const isDBReachable = await isPortReachable(dbPort, { host: 'localhost' });
    if (isDBReachable) {
        console.info('DB-Server bereits gestartet.');
        return;
    }

    // Container starten
    console.info('Docker-Container mit DB-Server wird gestartet.');
    try {
        await upAll({
            cwd: dockerComposeDir,
            commandOptions: [dbType],
            composeOptions: [['-f', `compose.${dbType}.yml`]],
            // Logging beim Hochfahren des DB-Containers
            log: true,
        });
    } catch (err: unknown) {
        console.error(`startDbServer: ${JSON.stringify(err)}`);
        return;
    }

    // Ist der DB-Server im Container bereit fuer DB-Anfragen?
    await exec(dbType, ['sh', '-c', dbHealthCheck], {
        cwd: dockerComposeDir,
    });
    console.info('Docker-Container mit DB-Server ist gestartet.');
};

const shutdownDbServer = async () => {
    // 'better-sqlite3' erfordert Python zum Uebersetzen, wenn das Docker-Image gebaut wird
    if (dbType === 'sqlite') {
        return;
    }
    await down({
        cwd: dockerComposeDir,
        composeOptions: [['-f', 'compose.postgres.yml']],
        log: true,
    });
};

// -----------------------------------------------------------------------------
// T e s t s e r v e r   m i t   H T T P S
// -----------------------------------------------------------------------------
let server: INestApplication;

export const startServer = async () => {
    if (
        env.START_DB_SERVER === 'true' ||
        env.START_DB_SERVER === 'TRUE' ||
        config.test?.startDbServer === true
    ) {
        console.info('DB-Server muss gestartet werden.');
        await startDbServer();
    }

    server = await NestFactory.create(AppModule, {
        httpsOptions,
        logger: ['log'],
        // logger: ['debug'],
    });
    server.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    );

    await server.listen(port);
    return server;
};

export const shutdownServer = async () => {
    try {
        await server.close();
    } catch {
        console.warn('Der Server wurde fehlerhaft beendet.');
    }

    if (env.START_DB_SERVER === 'true' || env.START_DB_SERVER === 'TRUE') {
        await shutdownDbServer();
    }
};

// fuer selbst-signierte Zertifikate
export const httpsAgent = new Agent({
    requestCert: true,
    rejectUnauthorized: false,
    ca: httpsOptions.cert as Buffer,
});
