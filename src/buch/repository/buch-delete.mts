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

import { type NodePgTransaction } from 'drizzle-orm/node-postgres';
import { buchTable } from '../../db/schema.mts';
import { eq } from 'drizzle-orm';
import { getLogger } from '../../logger/logger.mts';
import { type relations } from '../../db/relations.mts';

const logger = getLogger('buch-delete');

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
