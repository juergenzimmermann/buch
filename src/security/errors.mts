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
 * Error-Klasse für fehlende Authorisierung.
 */
export class UnauthorizedError extends Error {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Error-Klasse für fehlende Berechtigung.
 */
export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Error-Klasse für internen Fehler.
 */
export class InternalServerError extends Error {
    constructor(message?: string) {
        super(message);
    }
}
