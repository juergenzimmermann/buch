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
 * Das Modul besteht aus Funktionen für die Suche nach Büchern.
 * @packageDocumentation
 */

import { abbildungTable, buchTable, titelTable } from '../../db/schema.mts';
import { count, eq } from 'drizzle-orm';
import { type Pageable } from './pageable.mts';
import { type Suchparameter } from './suchparameter.mts';
import { buildWhere } from './build-where.mts';
import { db } from '../../config/db.mts';
import { getLogger } from '../../logger/logger.mts';

export type AbbildungSelect = typeof abbildungTable.$inferSelect;
export type TitelSelect = typeof titelTable.$inferSelect;
export type BuchSelect = typeof buchTable.$inferSelect;

export type BuchMitTitelSelect = { buch: BuchSelect; titel: TitelSelect };
export type BuchMitTitelUndAbbildungSelect = BuchMitTitelSelect & {
    abbildung: AbbildungSelect;
};

const logger = getLogger('buch-select');

// Rueckgabetyp Promise bei asynchronen Funktionen
//    ab ES2015
//    vergleiche Task<> bei C#
// Status eines Promise:
//    Pending:   das Resultat ist noch nicht vorhanden, weil die asynchrone
//               Operation noch nicht abgeschlossen ist
//    Fulfilled: die asynchrone Operation ist abgeschlossen und
//               das Promise-Objekt hat einen Wert
//    Rejected:  die asynchrone Operation ist fehlgeschlagen and das
//               Promise-Objekt wird nicht den Status "fulfilled" erreichen.
//               Im Promise-Objekt ist dann die Fehlerursache enthalten.

/**
 * Ein Buch asynchron anhand seiner ID suchen und den Titel mitladen
 * @param id ID des gesuchten Buches
 * @returns Das gefundene Buch in einem Promise.
 * @throws NotFoundError falls kein Buch mit der ID existiert
 */
export const selectById = async (id: number): Promise<Readonly<BuchMitTitelSelect> | undefined> => {
    logger.debug('selectById: id=%d', id);

    // Lesen: Keine Transaktion erforderlich
    const [row]: BuchMitTitelSelect[] = await db
        .select()
        .from(buchTable)
        .innerJoin(titelTable, eq(buchTable.id, titelTable.buchId))
        .where(eq(buchTable.id, id))
        .limit(1);

    logger.debug('selectById: row=%s', row);
    return row;
};

/**
 * Ein Buch asynchron anhand seiner ID suchen und den Titel und die Abbildungen mitladen
 * @param id ID des gesuchten Buches
 * @returns Das gefundene Buch in einem Promise.
 * @throws NotFoundError falls kein Buch mit der ID existiert
 */
export const selectByIdMitAbb = async (
    id: number,
): Promise<Readonly<BuchMitTitelUndAbbildungSelect[]>> => {
    logger.debug('selectByIdMitAbb: id=%d', id);

    const rows: BuchMitTitelUndAbbildungSelect[] = await db
        .select()
        .from(buchTable)
        .innerJoin(titelTable, eq(buchTable.id, titelTable.buchId))
        .innerJoin(abbildungTable, eq(buchTable.id, abbildungTable.buchId))
        .where(eq(buchTable.id, id));

    logger.debug('selectByIdMitAbb: rows=%o', rows);
    return rows;
};

/**
 * Die Version zu gegebener ID ermitteln.
 * @param id ID des gesuchten Buches
 * @returns Die Version in einem Promise.
 * @throws NotFoundError falls kein Buch mit der ID existiert
 */
export const selectVersionById = async (id: number): Promise<number | undefined> => {
    logger.debug('selectVersionById: id=%d', id);

    const [row]: { version: number }[] = await db
        .select({ version: buchTable.version })
        .from(buchTable)
        .where(eq(buchTable.id, id))
        .limit(1);

    // optional chaining
    const version = row?.version;
    logger.debug('selectVersionById: version=%s', version);
    return version;
};

/**
 * Gibt es ein Buch zur gegebenen ID
 * @param id ID des gesuchten Buches
 * @returns true in einem Promise, falls das Buch existiert, sonst false.
 */
export const existsId = async (id: number): Promise<boolean> => {
    logger.debug('existsId: id=%d', id);

    const [row]: { id: number }[] = await db
        .select({ id: buchTable.id })
        .from(buchTable)
        .where(eq(buchTable.id, id))
        .limit(1);

    if (row === undefined) {
        logger.debug('existsId: false');
        return false;
    }

    const exists = row !== undefined;
    logger.debug('existsId: %s', exists);
    return exists;
};

export const existsISBN = async (isbn: string): Promise<boolean> => {
    logger.debug('existsISBN: isbn=%s', isbn);

    const [exists] = await db
        .select({ count: count() })
        .from(buchTable)
        .where(eq(buchTable.isbn, isbn));

    logger.debug('existsISBN: exists=%s', exists);
    return exists?.count === 1;
};

export const selectAll = async (
    pageable: Pageable,
): Promise<Readonly<{ rows: BuchMitTitelSelect[]; totalElements: number }>> => {
    logger.debug('selectAll: pageable=%o', pageable);

    const { number, size } = pageable;
    const rows: BuchMitTitelSelect[] = await db
        .select()
        .from(buchTable)
        .innerJoin(titelTable, eq(buchTable.id, titelTable.buchId))
        .offset(number * size)
        .limit(size);

    const [countJson] = await db.select({ count: count() }).from(buchTable);
    const totalElements = countJson?.count ?? 0;

    logger.debug('selectAll: totalElements=%s', totalElements);
    return { rows, totalElements };
};

/**
 * Bücher asynchron suchen.
 * @param suchparameter JSON-Objekt mit Suchparameter.
 * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
 * @returns Ein JSON-Array mit den gefundenen Büchern.
 * @throws NotFoundError falls keine Bücher gefunden wurden.
 */
export const select = async (
    suchparameter: Record<string, string | undefined>,
    pageable: Pageable,
): Promise<
    Readonly<{ rows: BuchMitTitelSelect[]; totalElements: number | undefined } | undefined>
> => {
    logger.debug('select: suchparameter=%s, pageable=%o', JSON.stringify(suchparameter), pageable);

    // Keine Suchparameter?
    const keys = Object.keys(suchparameter);
    if (keys.length === 0) {
        return await selectAll(pageable);
    }

    const where = buildWhere(suchparameter as Suchparameter);
    if (where === undefined) {
        return;
    }
    const { number, size } = pageable;

    // Das Resultat ist eine leere Liste, falls nichts gefunden
    // Lesen: Keine Transaktion erforderlich
    const rows: BuchMitTitelSelect[] = await db
        .select()
        .from(buchTable)
        .innerJoin(titelTable, eq(buchTable.id, titelTable.buchId))
        .where(where)
        .offset(number * size)
        .limit(size);

    const [totalElements] = await db
        .select({ count: count() })
        .from(buchTable)
        .innerJoin(titelTable, eq(buchTable.id, titelTable.buchId))
        .where(where);
    return { rows, totalElements: totalElements?.count };
};
