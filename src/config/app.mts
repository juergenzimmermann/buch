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
 * Das Modul enthält Objekte mit Konfigurationsdaten aus der TOML-Datei.
 * @packageDocumentation
 */

// TOML mit Bun einlesen: inkompatibel mit Node
// https://bun.com/docs/guides/runtime/import-toml

import { readFile } from 'node:fs/promises';
import { parse } from 'smol-toml';
import { resourcesURL } from './resources.mts';

export type AppConfig = Record<
    'server' | 'db' | 'keycloak' | 'log' | 'health' | 'mail',
    any
>;

const appUrl = new URL('app.toml', resourcesURL);
const appText = await readFile(appUrl, { encoding: 'utf8' });
// alternativ: Bun.TOML.parse()
export const config = parse(appText) as AppConfig;
