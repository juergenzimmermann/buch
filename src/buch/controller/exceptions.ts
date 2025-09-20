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

/* eslint-disable max-classes-per-file */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Das Modul besteht aus den Klassen für die Fehlerbehandlung bei der Verwaltung
 * von Büchern, z.B. beim Datei-Upload.
 * @packageDocumentation
 */

/**
 * Exception-Klasse für einen nicht-zulaessigen MIME-Type.
 */
export class InvalidMimeTypeException extends HttpException {
    readonly mimeType: string | undefined;

    constructor(mimeType: string | undefined) {
        super(
            `Der MIME-Type ${mimeType} ist nicht zulaessig.`,
            // TODO https://github.com/nestjs/nest/issues/15624 https://github.com/nodejs/node/blob/main/lib/_http_server.js#L159
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
        this.mimeType = mimeType;
    }
}
