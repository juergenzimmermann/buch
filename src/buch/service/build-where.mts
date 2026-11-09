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
 * Das Modul besteht aus der Klasse {@linkcode WhereBuilder}.
 * @packageDocumentation
 */

import { type Buchart, type Suchparameter } from './suchparameter.mts';
import { type SQLWrapper, and, arrayContains, eq, gte, ilike, lte } from 'drizzle-orm';
import { buchTable, titelTable } from '../../db/schema.mts';
import { NotFoundError } from './errors.mts';
import { getLogger } from '../../logger/logger.mts';

type Schlagwort = string | boolean | undefined;
const buildSchlagwoerter = ({
    javascript,
    typescript,
    java,
    python,
}: {
    javascript: Schlagwort;
    typescript: Schlagwort;
    java: Schlagwort;
    python: Schlagwort;
}): ReadonlyArray<string> => {
    const schlagwoerter: string[] = [];
    if (typeof javascript === 'boolean' || javascript?.toLowerCase() === 'true') {
        schlagwoerter.push('JAVASCRIPT');
    }
    if (typeof typescript === 'boolean' || typescript?.toLowerCase() === 'true') {
        schlagwoerter.push('TYPESCRIPT');
    }
    if (typeof java === 'boolean' || java?.toLowerCase() === 'true') {
        schlagwoerter.push('JAVA');
    }
    if (typeof python === 'boolean' || python?.toLowerCase() === 'true') {
        schlagwoerter.push('PYTHON');
    }
    return schlagwoerter;
};

/** Typdefinitionen für die Suche mit der Buch-ID. */
export type BuildIdParams = {
    /** ID des gesuchten Buchs. */
    readonly id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    readonly mitAbbildungen?: boolean;
};

const logger = getLogger('buildWhere', 'func');

/**
 * WHERE-Klausel für die flexible Suche nach Büchern bauen.
 * @param suchparameter JSON-Objekt mit Suchparameter. Bei "titel" wird mit
 * einem Teilstring gesucht, bei "rating" mit einem Mindestwert, bei "preis"
 * mit der Obergrenze.
 * @returns BuchWhereInput
 */
// "rest properties" ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
// oxlint-disable-next-line max-lines-per-function
export const buildWhere = ({
    javascript,
    typescript,
    java,
    python,
    ...restProps
}: Suchparameter) => {
    logger.debug(
        'buildWhere: javascript=%s, typescript=%s, java=%s, python=%s, restProps=%o',
        javascript,
        typescript,
        java,
        python,
        restProps,
    );

    // Beispiel: { titel: 'a', rating: 4, preis: 22.5, javascript: true }
    // wird zu:
    // WHERE titel ILIKE %a% AND rating >= 4 AND preis <= 22.5 AND schlagwoerter @> '["JAVASCRIPT"]'
    const conditions: SQLWrapper[] = [];

    // Properties vom Typ number, enum, boolean, Date
    // diverse Vergleiche, z.B. Gleichheit, <= (lte), >= (gte)
    Object.entries(restProps).forEach(([key, value]) => {
        switch (key) {
            case 'titel':
                conditions.push(ilike(titelTable.titel, `%${value}%`));
                break;
            case 'isbn':
                conditions.push(eq(buchTable.isbn, value as string));
                break;
            case 'rating': {
                const ratingNumber = Number.parseInt(value as string, 10);
                if (!Number.isNaN(ratingNumber)) {
                    conditions.push(gte(buchTable.rating, ratingNumber));
                }
                break;
            }
            case 'preis': {
                const preisNumber = Number.parseFloat(value as string);
                if (!Number.isNaN(preisNumber)) {
                    const condition = lte(buchTable.preis, value as string);
                    conditions.push(condition);
                }
                break;
            }
            case 'art':
                // enum
                conditions.push(eq(buchTable.art, value as Buchart));
                break;
            case 'lieferbar': {
                let lieferbar = true;
                if (typeof value === 'string') {
                    lieferbar = value.toLowerCase() === 'true';
                } else if (typeof value === 'boolean') {
                    lieferbar = value;
                }
                conditions.push(eq(buchTable.lieferbar, lieferbar));
                break;
            }
            case 'datum':
                conditions.push(gte(buchTable.datum, new Date(value as string)));
                break;
            case 'homepage':
                conditions.push(eq(buchTable.homepage, value as string));
                break;
            default:
                break;
        }
    });

    const schlagwoerter = buildSchlagwoerter({
        javascript,
        typescript,
        java,
        python,
    });
    if (schlagwoerter.length > 0) {
        console.log('!!!schlagwoerter', schlagwoerter);
        conditions.push(arrayContains(buchTable.schlagwoerter, schlagwoerter));
    }

    if (conditions.length === 0) {
        logger.debug('buildWhere: Ungueltige Suchparameter');
        throw new NotFoundError('Ungueltige Suchparameter');
    }

    const where = and(...conditions);
    logger.debug('buildWhere: <return>');
    return where;
};
