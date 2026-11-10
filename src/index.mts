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

import { app } from './app.mts';
import { banner } from './logger/banner.mts';
import { createSecureServer } from 'node:http2';
import { disconnectDB } from './config/db.mts';
import { getConfig } from './config/config.mts';
import { getLogger } from './logger/logger.mts';
import { populate } from './config/dev/db-populate.mts';
import process from 'node:process';
import { readFile } from 'node:fs/promises';

const logger = getLogger('app');

// "Top-level await"
const config = await getConfig();
logger.debug('config: %o', config);

// Destructuring
const { allowHTTP1, certFile, keyFile, nodeEnv, port, runtime } = config.server;

if (nodeEnv === 'development' || nodeEnv === 'test') {
    // selbst-signiertes Zertifikat: Umgebungsvariable NODE_TLS_REJECT_UNAUTHORIZED setzen
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

// app.fetch ist ist eine Funktion passend zur Signatur von fetch von @hono/node-server (s.u.):
// (request: Request) => Response | Promise<Response>
// Innerhalb von Hono erfolgt dann das Dispatching zu einer Route fuer GET, POST, usw.
const { fetch } = app;

await populate();

// fetch: Request-Handler fuer den Node- oder Bun-Server mit Signatur gemaess Fetch-API von ES2015
// d.h. eine Funktion, die einen Request empfaengt und einen Response produziert:
// async function handler(req: Request): Promise<Response> { ... }
// https://hono.dev/docs/getting-started/nodejs#http2
// curl -v -k --http2 --tlsv1.3 -H 'Accept: application/json' https://localhost:3000/rest/1
// curl -v -k --http3 -H 'Accept: application/json' https://localhost:3000/rest/1

// TODO node:quic https://www.jasnell.me/posts/quic-comes-to-node https://github.com/nodejs/node/blob/main/doc/api/quic.md

// public/private keys und Zertifikat fuer TLS
const key = await readFile(keyFile, { encoding: 'utf8' });
const cert = await readFile(certFile, { encoding: 'utf8' });

if (runtime === 'Bun') {
    const Bun = await import('bun');
    Bun.serve({
        // Shorthand Property
        fetch,
        port,
        tls: {
            key,
            cert,
        },
    });
} else {
    // Node als Default-Laufzeitumgebung
    const nodeServer = await import('@hono/node-server');
    nodeServer.serve(
        {
            // Shorthand Property
            fetch,
            port,
            createServer: createSecureServer,
            serverOptions: {
                key,
                cert,
                minVersion: 'TLSv1.3',
                maxVersion: 'TLSv1.3',
                // Angular HttpClient kann nur HTTP 1.1
                allowHTTP1,
            },
        },
        (info) => {
            logger.info(`Der Server ist mit HTTPS und Port ${info.port} gestartet`);
        },
    );
}

await banner();

// KEINE asynchrone Funktion
process.on('SIGINT', () => {
    // IIFE  = Immediately Invoked Function Expression
    // IIAFE = Immediately Invoked Asynchronous Function Expression
    (async () => {
        try {
            await disconnectDB();
        } catch {
            console.log('Fehler beim Trennen der DB-Verbindung.');
        }
    })();

    // Pino loggt asynchron
    console.log('Der Server wird heruntergefahren.');
});
