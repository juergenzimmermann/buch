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
 * Das Modul enthält die Konfiguration für das DB-System.
 * @packageDocumentation
 */
import { URL } from 'node:url';
import { config } from './app.js';
import { resourcesURL } from './resources.js';

export const dbURL = new URL('postgresql/', resourcesURL);
console.debug('dbURL = %s', dbURL);

const { db } = config;
export const dbPopulate = db?.populate === true;
