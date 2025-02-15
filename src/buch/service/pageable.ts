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

export type Pageable = {
    readonly number: number;
    readonly size: number;
};

type PageableProps = {
    readonly number?: string | undefined;
    readonly size?: string | undefined;
};

export function getPageable({ number, size }: PageableProps): Pageable {
    let numberInt = Math.floor(Number(number)) || DEFAULT_PAGE_NUMBER;
    if (numberInt < 0) {
        numberInt = DEFAULT_PAGE_NUMBER;
    }
    let sizeInt = Math.floor(Number(size)) || DEFAULT_PAGE_SIZE;
    if (sizeInt < 0 || sizeInt > MAX_PAGE_SIZE) {
        sizeInt = DEFAULT_PAGE_SIZE;
    }
    return { number: numberInt, size: sizeInt };
}
