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

import {
    type AbbildungSelect,
    type BuchSelect,
    type TitelSelect,
} from '../repository/buch-select.mts';
import { AbbildungDTO } from './abbildung-dto.mts';
import { TitelDTO } from './titel-dto.mts';

export class BuchDTO {
    id: number;
    version: number;
    isbn: string;
    rating: number;
    art: string | null;
    preis: number;
    rabatt: number;
    lieferbar: boolean;
    datum: Date | null;
    homepage: string | null;
    schlagwoerter: string[];
    titel?: TitelDTO;
    abbildungen?: AbbildungDTO[];

    constructor(
        drizzleBuch: BuchSelect,
        drizzleTitel?: TitelSelect,
        drizzleAbbildungen?: AbbildungSelect[],
    ) {
        const {
            id,
            version,
            isbn,
            rating,
            art,
            preis,
            rabatt,
            lieferbar,
            datum,
            homepage,
            schlagwoerter,
        } = drizzleBuch;
        this.id = id;
        this.version = version;
        this.isbn = isbn;
        this.rating = rating;
        this.art = art;
        this.preis = Number.parseInt(preis, 10);
        this.rabatt = Number.parseInt(rabatt, 10);
        this.lieferbar = lieferbar;
        this.datum = datum === null ? null : new Date(datum);
        this.homepage = homepage;
        this.schlagwoerter = schlagwoerter as string[];
        if (drizzleTitel !== undefined) {
            this.titel = new TitelDTO(drizzleTitel);
        }
        if (drizzleAbbildungen !== undefined) {
            this.abbildungen = drizzleAbbildungen.map((abb) => new AbbildungDTO(abb));
        }
    }
}
