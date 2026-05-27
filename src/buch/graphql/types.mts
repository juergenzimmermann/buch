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
    type BuchCreate,
    type BuchUpdate,
} from '../service/buch-write-service.mts';
import { type BuchMitTitelUndAbbildungenDTO } from '../service/buch-service.mts';
import { type Suchparameter } from '../service/suchparameter.mts';

// -----------------------------------------------------------------------------
// I D   u n d   I n t   f u e r   G r a p h Q L
// -----------------------------------------------------------------------------

// Ein "branded type" bleibt derselbe Typ im Typsystem, erhaelt aber eine
// zusaetzliche Property, die NUR im Typsystem verfuegbar ist
// siehe https://www.learningtypescript.com/articles/branded-types
export type ID = string & { readonly __brand: 'ID' };
export type Int = number & { readonly __brand: 'Int' };

export const toID = (value: string | number): ID => {
    if (typeof value === 'string') {
        return value as ID;
    }
    return value.toString() as ID;
};
export const toInt = (num: number): Int =>
    (Number.isInteger(num) ? num : Math.round(num)) as Int;
export const toNumber = (id: ID): number => Number.parseInt(id, 10);
const toDateOrNull = (dateStr?: string | null): Date | null =>
    dateStr === undefined || dateStr === null ? null : new Date(dateStr);

// -----------------------------------------------------------------------------
// S u c h e
// -----------------------------------------------------------------------------
export type Buch = {
    id: ID;
    version: number;
    isbn: string;
    rating?: Int;
    art?: 'EPUB' | 'HARDCOVER' | 'PAPERBACK';
    preis: number;
    rabatt: number;
    lieferbar: boolean;
    datum?: string | undefined;
    homepage?: string;
    schlagwoerter: string[];
    titel: { titel: string; untertitel?: string };
};

export const toBuchType = (buch: BuchMitTitelUndAbbildungenDTO): Buch => {
    const result: Buch = {
        id: toID(buch.id),
        version: buch.version,
        isbn: buch.isbn,
        rating: toInt(buch.rating),
        art: buch.art ?? 'HARDCOVER',
        preis: buch.preis,
        rabatt: buch.rabatt,
        lieferbar: buch.lieferbar,
        schlagwoerter: [],
        titel: {
            titel: buch.titel?.titel ?? 'N/A',
        },
    };

    // optionale Properties setzen, falls sie vorhanden sind
    const { datum, homepage, titel } = buch;
    if (datum !== null) {
        result.datum = datum.toISOString();
    }
    if (homepage !== null) {
        result.homepage = homepage;
    }
    if (titel !== null && titel.untertitel !== null) {
        result.titel.untertitel = titel.untertitel;
    }

    return result;
};

export type SuchParameterInput = {
    titel?: string | undefined;
    isbn?: string | undefined;
    rating?: Int | undefined;
    art?: 'EPUB' | 'HARDCOVER' | 'PAPERBACK' | undefined;
    lieferbar?: boolean | undefined;
};

export const toSuchparameter = (param?: SuchParameterInput) => {
    if (param === undefined) {
        return null;
    }

    const { titel, isbn, rating, art, lieferbar } = param;
    const suchparameter: Record<string, any> = {};
    if (titel !== undefined) {
        suchparameter['titel'] = titel;
    }
    if (isbn !== undefined) {
        suchparameter['isbn'] = isbn;
    }
    if (rating !== undefined) {
        suchparameter['rating'] = rating;
    }
    if (art !== undefined) {
        suchparameter['art'] = art;
    }
    if (lieferbar !== undefined) {
        // Boole'scher Wert bei GraphQL-Query
        // String bei Query-Parameter bei REST
        suchparameter['lieferbar'] = lieferbar.toString();
    }
    return suchparameter as Suchparameter;
};

// -----------------------------------------------------------------------------
// N e u a n l e g e n
// -----------------------------------------------------------------------------
export type BuchNeuInput = {
    isbn: string;
    rating: Int;
    preis: number;
    rabatt: number;
    lieferbar: boolean;
    titel: { titel: string; untertitel?: string };

    art?: 'EPUB' | 'HARDCOVER' | 'PAPERBACK';
    datum?: string;
    homepage?: string;
    schlagwoerter?: string[];
    abbildungen?: { beschriftung: string; contentType: string }[];
};

export const toCreate = (buch: BuchNeuInput): BuchCreate => {
    const {
        isbn,
        rating,
        art,
        preis,
        rabatt,
        lieferbar,
        datum,
        homepage,
        schlagwoerter,
        titel,
        abbildungen,
    } = buch;
    const buchCreate: BuchCreate = {
        version: 0,
        isbn,
        rating,
        art: art ?? null,
        preis,
        rabatt,
        lieferbar,
        datum: toDateOrNull(datum),
        homepage: homepage ?? null,
        schlagwoerter: schlagwoerter ?? [],
        titel: {
            // fuer Prisma und die generierte Funktion "create"
            create: {
                titel: titel.titel,
                untertitel: titel.untertitel ?? null,
            },
        },
        abbildungen: {
            create: (abbildungen ?? []).map((abbildung) => {
                const { beschriftung, contentType } = abbildung;
                return {
                    beschriftung,
                    contentType,
                };
            }),
        },
    };
    return buchCreate;
};

export type CreatePayload = {
    readonly id: ID;
};

// -----------------------------------------------------------------------------
// A e n d e r n
// -----------------------------------------------------------------------------
export type BuchUpdateInput = Omit<BuchNeuInput, 'titel' | 'abbildungen'> & {
    id: ID;
    version: Int;
};

export const toUpdate = (buch: BuchUpdateInput): BuchUpdate => {
    const {
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
    } = buch;
    const buchUpdate: BuchUpdate = {
        version,
        isbn,
        rating,
        art: art ?? null,
        preis,
        rabatt,
        lieferbar,
        datum: toDateOrNull(datum),
        homepage: homepage ?? null,
        schlagwoerter: schlagwoerter ?? [],
    };
    return buchUpdate;
};

export type UpdatePayload = {
    readonly version: Int;
};

// -----------------------------------------------------------------------------
// L o e s c h e n
// -----------------------------------------------------------------------------
export type DeletePayload = {
    readonly success: boolean;
};

// -----------------------------------------------------------------------------
// S e c u r i t y
// -----------------------------------------------------------------------------
export type TokenPayload = {
    readonly access_token: string;
    readonly expires_in: Int;
    readonly refresh_token: string;
    readonly xpires_in: Int;
};
