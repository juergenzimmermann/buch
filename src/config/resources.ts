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

import { access } from 'node:fs/promises';
import path from 'node:path';

// im Docker-Image gibt es kein Unterverzeichnis "src"
let srcExists: boolean;
try {
    // https://nodejs.org/api/fs.html#fspromisesaccesspath-mode
    await access('src');
    srcExists = true;
} catch {
    srcExists = false;
}
export const BASEDIR = srcExists ? 'src' : 'dist';

// https://nodejs.org/api/path.html
export const resourcesDir = path.resolve(BASEDIR, 'config', 'resources');

console.debug('resourcesDir = %s', resourcesDir);

const resourcesURL = new URL('resources', import.meta.url);
console.debug('resourcesURL = %s', resourcesURL);
