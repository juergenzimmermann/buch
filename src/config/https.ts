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

/**
 * Das Modul enthält die Konfiguration für den _Node_-basierten Server.
 * @packageDocumentation
 */

import { type HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface.js';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { resourcesURL } from './resources.js';

// https://nodejs.org/api/path.html
// https://nodejs.org/api/fs.html
// http://2ality.com/2017/11/import-meta.html

const tlsURL = new URL('tls/', resourcesURL);
console.debug('tlsURL = %s', tlsURL);

// public/private keys und Zertifikat fuer TLS
export const httpsOptions: HttpsOptions = {
    key: await readFile(new URL('key.pem', tlsURL)), // eslint-disable-line security/detect-non-literal-fs-filename
    cert: await readFile(new URL('certificate.crt', tlsURL)), // eslint-disable-line security/detect-non-literal-fs-filename
};
