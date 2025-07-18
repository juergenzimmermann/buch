// Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul besteht aus der Transformer-Klasse für Spalten vom Typ DECIMAL.
 * @packageDocumentation
 */

import BigNumber from 'bignumber.js'; // eslint-disable-line @typescript-eslint/naming-convention
import { type ValueTransformer } from 'typeorm';

// https://github.com/typeorm/typeorm/issues/873#issuecomment-328945433
// "grosse" Zahlen als String und nicht number (Stichwort: Rundungsfehler)
// statt number BigNumber aus bignumber.js analog zu BigDecimal von Java
// https://medium.com/@matthew.bajorek/how-to-properly-handle-decimals-with-typeorm-f0eb2b79ca9c
export class BigNumberTransformer implements ValueTransformer {
    /**
     * Transformation beim Schreiben in die DB
     */
    to(bigNumber?: BigNumber): string | undefined {
        return bigNumber?.toString();
    }

    /**
     * Transformation beim Lesen aus der DB
     */
    from(str?: string): BigNumber | undefined {
        return str === undefined ? undefined : BigNumber(str);
    }
}
