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
import { Hono } from 'hono';

/**
 * Web-Applikation mit Hono.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const app = new Hono();

app.get('/', (c) => c.json({ msg: 'Hello World' }));

// fetch: Request-Handler fuer den Bun-Server mit Signatur gemaess Fetch-API von ES2015
// d.h. eine Funktion, die einen Request empfaengt und einen Response produziert:
// async function handler(req: Request): Promise<Response> { ... }
Bun.serve({ port: 3000, fetch: app.fetch });

console.log('Der Server http://localhost:3000 ist gestartet');
