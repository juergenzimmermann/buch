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

import { connectDB, disconnectDB } from './config/prisma-client.mts';
import { app } from './app.mts';
import { banner } from './logger/banner.mts';
import { createSecureServer } from 'node:http2';
import { env } from './config/env.mts';
import { populate } from './config/dev/db-populate.mts';
import process from 'node:process';
import { serve } from '@hono/node-server';
import { serverConfig } from './config/server.mts';

// Destructuring
const { NODE_ENV } = env;
if (NODE_ENV === 'development' || NODE_ENV === 'test') {
    // selbst-signiertes Zertifikat: Umgebungsvariable NODE_TLS_REJECT_UNAUTHORIZED setzen
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

// app.fetch ist ist eine Funktion passend zur Signatur von fetch von @hono/node-server (s.u.):
// (request: Request) => Response | Promise<Response>
// Innerhalb von Hono erfolgt dann das Dispatching zu einer Route fuer GET, POST, usw.
const { fetch } = app;
const { port, key, cert, allowHTTP1 } = serverConfig;

await populate();
await connectDB();

// fetch: Request-Handler fuer den Node-Server mit Signatur gemaess Fetch-API von ES2015
// d.h. eine Funktion, die einen Request empfaengt und einen Response produziert:
// async function handler(req: Request): Promise<Response> { ... }
// https://hono.dev/docs/getting-started/nodejs#http2
// curl -v -k --http2 --tlsv1.3 -H 'Accept: application/json' https://localhost:3000/rest/1
// curl -v -k --http3 -H 'Accept: application/json' https://localhost:3000/rest/1
// TODO node:quic https://www.jasnell.me/posts/quic-comes-to-node https://github.com/nodejs/node/blob/main/doc/api/quic.md
serve(
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
            allowHTTP1,
        },
    },
    (info) => {
        console.log(
            `🚀 Der Server ist mit HTTPS und Port ${info.port} gestartet`,
        );
    },
);

await banner();

// KEINE asynchrone Funktion
process.on('SIGINT', () => {
    // IIFE  = Immediately Invoked Function Expression
    // IIAFE = Immediately Invoked Asynchronous Function Expression
    (async () => {
        await disconnectDB();
    })();

    console.log('Der Server wird heruntergefahren.');
});
