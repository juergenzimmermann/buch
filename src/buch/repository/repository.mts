// oxlint-disable max-lines
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

import { abbildungTable, buchFileTable, buchTable, titelTable } from '../../db/schema.mts';
import { count, eq, sql } from 'drizzle-orm';
import { type NodePgTransaction } from 'drizzle-orm/node-postgres';
import { type Pageable } from './pageable.mts';
import { type Suchparameter } from './suchparameter.mts';
import { buildWhere } from './build-where.mts';
import { db } from '../../config/db.mts';
import { getLogger } from '../../logger/logger.mts';
import { type relations } from '../../db/relations.mts';

export type AbbildungSelect = typeof abbildungTable.$inferSelect;
export type TitelSelect = typeof titelTable.$inferSelect;
export type BuchSelect = typeof buchTable.$inferSelect;

export type BuchMitTitelSelect = { buch: BuchSelect; titel: TitelSelect };
export type BuchMitTitelUndAbbildungSelect = BuchMitTitelSelect & {
    abbildung: AbbildungSelect;
};

export type BuchInsert = typeof buchTable.$inferInsert;
// ohne Fremdschluessel-Spalte
export type TitelInsert = Omit<typeof titelTable.$inferInsert, 'buchId'>;
// ohne Fremdschluessel-Spalte
export type AbbildungInsert = Omit<typeof abbildungTable.$inferInsert, 'buchId'>;
export type InsertType = {
    buch: BuchInsert;
    titel: TitelInsert;
    abbildungen?: AbbildungInsert[];
};

export type BuchUpdate = Omit<BuchInsert, 'version' | 'erzeugt' | 'aktualisiert'>;

export type BuchFileInsert = typeof buchFileTable.$inferInsert;
export type BuchFileSelect = typeof buchFileTable.$inferSelect;

const logger = getLogger('repository');

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
    logger.debug('selectAll: id=%o', pageable);

    const { number, size } = pageable;
    const rows: BuchMitTitelSelect[] = await db
        .select()
        .from(buchTable)
        .innerJoin(titelTable, eq(buchTable.id, titelTable.buchId))
        .offset(number * size)
        .limit(size);

    const totalElements = rows.length;

    logger.debug('selectAll: totalElements=%d', totalElements);
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

/**
 * In die Tabelle _buch_ wird ein neuer Datensatz eingefügt.
 * @param buch Neuer Datensatz für die Tabelle _buch_.
 * @param tx Laufende Transaktion
 * @returns Generierte ID oder undefined
 */
export const insertBuch = async (buch: BuchInsert, tx: NodePgTransaction<typeof relations>) => {
    logger.debug('insertBuch: buch=%o', buch);
    // https://orm.drizzle.team/docs/insert
    const [idResult] = await tx.insert(buchTable).values(buch).returning({ id: buchTable.id });
    const id = idResult?.id;
    logger.debug('insertBuch: id=%s', id);
    return id;
};

/**
 * In die Tabelle _titel_ wird ein neuer Datensatz eingefügt.
 * @param titel Neuer Datensatz für die Tabelle _titel_.
 * @param tx Laufende Transaktion
 * @returns Generierte ID oder undefined
 */
export const insertTitel = async (
    titel: TitelInsert,
    buchId: number,
    tx: NodePgTransaction<typeof relations>,
) => {
    logger.debug('insertTitel: titel=%o', titel);
    // https://orm.drizzle.team/docs/insert
    const [idResult] = await tx
        .insert(titelTable)
        .values({ ...titel, buchId })
        .returning({ id: titelTable.id });
    const id = idResult?.id;
    logger.debug('insertTitel: id=%s', id);
    return id;
};

/**
 * In die Tabelle _abbildung_ wird ein neuer Datensatz eingefügt.
 * @param titel Neuer Datensatz für die Tabelle _abbildung_.
 * @param buchId Fremdschlüssel für die Tabelle _buch_.
 * @param tx Laufende Transaktion
 * @returns Generierte ID oder undefined
 */
export const insertAbbildung = async (
    abbildung: AbbildungInsert,
    buchId: number,
    tx: NodePgTransaction<typeof relations>,
) => {
    logger.debug('insertAbbildung: abbildung=%o', abbildung);
    // https://orm.drizzle.team/docs/insert
    const [idResult] = await tx
        .insert(abbildungTable)
        .values({ ...abbildung, buchId })
        .returning({ id: abbildungTable.id });
    const id = idResult?.id;
    logger.debug('insertTitel: id=%s', id);
    return id;
};

/**
 * In der Tabelle _buch_ wird ein Datensatz modifiziert.
 * @param id ID des zu modifizierenden Buchs.
 * @param buch Neuer Datensatz für die Tabelle _buch_.
 * @param version Neue Versionsnummer
 * @param tx Laufende Transaktion
 * @returns Generierte ID oder undefined
 */
// oxlint-disable-next-line max-params
export const updateBuch = async (
    id: number,
    buch: BuchUpdate,
    version: number,
    tx: NodePgTransaction<typeof relations>,
) => {
    logger.debug('updateBuch: id=%d, buch=%o, version=%d', id, buch, version);
    const data = {
        ...buch,
        version,
        // Funktion "now" von SQL durch den Template-String aufrufen
        aktualisiert: sql`now()`,
    };
    // https://orm.drizzle.team/docs/update
    await tx
        .update(buchTable)
        .set(data)
        .where(eq(buchTable.id, id))
        .returning({ version: buchTable.version });
    logger.debug('updateBuch: id=%s', id);
    return version;
};

/**
 * In der Tabelle _buch_ wird ein Datensatz gelöscht.
 * @param id ID des zu löschenden Buchs.
 * @param tx Laufende Transaktion
 * @returns Generierte ID oder undefined
 */
export const deleteBuch = async (id: number, tx: NodePgTransaction<typeof relations>) => {
    logger.debug('deleteBuch: id=%d', id);
    // https://orm.drizzle.team/docs/delete
    // "CREATE TABLE" mit "ON DELETE CASCADE"
    const [idDelete] = await tx
        .delete(buchTable)
        .where(eq(buchTable.id, id))
        .returning({ id: buchTable.id });
    const deleted = idDelete !== undefined;
    logger.debug('deleteBuch: id=%s', deleted);
    return deleted;
};

/**
 * Binärdatei zu einem Buch suchen.
 * @param buchId ID des zugehörigen Buchs.
 * @returns Binärdatei oder undefined als Promise.
 */
export const selectFileByBuchId = async (
    buchId: number,
): Promise<Readonly<BuchFileSelect | undefined>> => {
    logger.debug('selectFileByBuchId: buchId=%d', buchId);
    const [buchFile]: BuchFileSelect[] = await db
        .select()
        .from(buchFileTable)
        .where(eq(buchFileTable.buchId, buchId))
        .limit(1);

    logger.debug(
        'selectFileByBuchId: id=%s, filename=%s, mimetype=%s, buchId=%s',
        buchFile?.id,
        buchFile?.filename,
        buchFile?.mimetype,
        buchFile?.buchId,
    );

    return buchFile;
};

/**
 * In der Tabelle _buch_file_ wird ein Datensatz gelöscht.
 * @param data Bytes
 * @param filename Dateiname
 * @param mimetype MIME-Typ
 * @param buchId ID des Buches passend zum zu löschenden Datensatz.
 * @param tx Laufende Transaktion
 * @returns Generierte ID oder undefined
 */
// oxlint-disable-next-line max-params
export const insertBuchFile = async (
    data: Buffer,
    filename: string,
    mimetype: string,
    buchId: number,
    tx: NodePgTransaction<typeof relations>,
) => {
    logger.debug(
        'insertBuchFile:, filename=%s, mimetype=%s, buchId=%d',
        filename,
        mimetype,
        buchId,
    );
    const buchFile: BuchFileInsert = {
        data: data as Uint8Array<ArrayBuffer>,
        filename,
        mimetype,
        buchId,
    };
    const [result] = await tx
        .insert(buchFileTable)
        .values(buchFile)
        .returning({ id: buchFileTable.id });
    logger.debug('insertBuchFile');
    return result;
};

/**
 * In der Tabelle _buch_file_ wird ein Datensatz gelöscht.
 * @param buchId ID des Buches passend zum zu löschenden Datensatz.
 * @param tx Laufende Transaktion
 * @returns Generierte ID oder undefined
 */
export const deleteBuchFile = async (buchId: number, tx: NodePgTransaction<typeof relations>) => {
    logger.debug('deleteBuchFile: buchId=%d', buchId);
    // evtl. vorhandene Datei löschen
    await tx.delete(buchFileTable).where(eq(buchFileTable.buchId, buchId)).returning();
    logger.debug('deleteBuchFile');
};
