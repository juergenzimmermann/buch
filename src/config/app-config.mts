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

import { configURL } from './config-url.mts';
import { parse } from 'smol-toml';
import { readFile } from 'node:fs/promises';

export type Config = Record<'server' | 'db' | 'keycloak' | 'log' | 'health' | 'mail', any>;

const configUrl = new URL('config.toml', configURL);
const configText = await readFile(configUrl, { encoding: 'utf8' });
export const config = parse(configText) as Config;

console.log(`!!!config aus config.toml: ${JSON.stringify(config)}`);
