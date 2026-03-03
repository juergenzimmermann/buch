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

import Bun from 'bun'; // eslint-disable-line @typescript-eslint/naming-convention
import process from 'node:process'; // eslint-disable-line import/order
import { app } from './app.mts';
import { env } from './config/env.mts';
import { connectDB, disconnectDB } from './config/prisma-client.mts';
import { serverConfig } from './config/server.mts';
import { container } from './container.mts';
import { banner } from './logger/banner.mts';

const { NODE_ENV } = env;
if (NODE_ENV === 'development' || NODE_ENV === 'test') {
    // selbst-signiertes Zertifikat: Umgebungsvariable NODE_TLS_REJECT_UNAUTHORIZED setzen
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // eslint-disable-line n/no-process-env
}

// app.fetch ist ist eine Funktion passend zur Signatur von fetch von Bun (s.u.):
// (request: Request) => Response | Promise<Response>
// Innerhalb von Hono erfolgt dann das Dispatching zu einer Route fuer GET, POST, usw.
const { fetch } = app;
const { port, portHttp, key, cert } = serverConfig;

await container.dbPopulateService.populate();
await connectDB();

// fetch: Request-Handler fuer den Bun-Server mit Signatur gemaess Fetch-API von ES2015
// d.h. eine Funktion, die einen Request empfaengt und einen Response produziert:
// async function handler(req: Request): Promise<Response> { ... }
Bun.serve({ port: portHttp, fetch });
Bun.serve({
    port,
    fetch,
    tls: {
        key,
        cert,
    },
});

await banner();

// https://bun.com/docs/guides/process/os-signals
// KEINE asynchrone Funktion
process.on('SIGINT', () => {
    // IIFE  = Immediately Invoked Function Expression
    // IIAFE = Immediately Invoked Asynchronous Function Expression
    (async () => {
        await disconnectDB();
    })();

    console.log('Der Server wird heruntergefahren.');
});
