// Copyright (C) 2024 - present Juergen Zimmermann, Hochschule Karlsruhe
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

export const DEFAULT_PAGE_SIZE = 5;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_NUMBER = 0;

/**
 * Datenstruktur für _Pagination_.
 */
export type Pageable = {
    /**
     * Seitennummer mit Zählung ab 0.
     */
    readonly number: number;
    /**
     * Maximale Anzahl Datensätze auf einer Seite
     */
    readonly size: number;
};

/**
 * Datenstruktur, wenn ein Objekt von `Pageable` erstellt wird.
 */
export type PageableProps = {
    /**
     * Seitennummer mit Zählung ab 0.
     */
    readonly number?: string | undefined;

    /**
     * Maximale Anzahl Datensätze auf einer Seite
     */
    readonly size?: string | undefined;
};

/**
 * Factory-Funktion, um ein Objekt vom Typ `Pageable` zu erstellen.
 * @returns Objekt vom Typ `Pageable`.
 */
export function createPageable({ number, size }: PageableProps): Pageable {
    let numberFloat = Number(number);
    let numberInt: number;
    if (Number.isNaN(numberFloat) || !Number.isInteger(numberFloat)) {
        numberInt = DEFAULT_PAGE_NUMBER;
    } else {
        numberInt = numberFloat - 1;
        if (numberInt < 0) {
            numberInt = DEFAULT_PAGE_NUMBER;
        }
    }

    let sizeFloat = Number(size);
    let sizeInt: number;
    if (Number.isNaN(sizeFloat) || !Number.isInteger(sizeFloat)) {
        sizeInt = DEFAULT_PAGE_SIZE;
    } else {
        sizeInt = sizeFloat;
        if (sizeInt < 1 || sizeInt > MAX_PAGE_SIZE) {
            sizeInt = DEFAULT_PAGE_NUMBER;
        }
    }

    return { number: numberInt, size: sizeInt };
}
