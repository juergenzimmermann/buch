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
import { type NodePgTransaction } from 'drizzle-orm/node-postgres';
import { getLogger } from '../../logger/logger.mts';
import { type relations } from '../../db/relations.mts';

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

const logger = getLogger('buch-insert');

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
