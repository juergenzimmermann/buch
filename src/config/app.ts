// Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul enthält Objekte mit Konfigurationsdaten aus der YAML-Datei.
 * @packageDocumentation
 */

import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { parse } from 'smol-toml';
import { resourcesURL } from './resources.js';

const configURL = new URL('app.toml', resourcesURL);
console.debug(`configURL=${configURL}`);

export type AppConfig = Record<
    'node' | 'db' | 'keycloak' | 'log' | 'health' | 'mail',
    any
>;

export const config = parse(
    await readFile(configURL, 'utf8'), // eslint-disable-line security/detect-non-literal-fs-filename
) as AppConfig;
