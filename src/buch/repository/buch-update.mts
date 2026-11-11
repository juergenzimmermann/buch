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

import { eq, sql } from 'drizzle-orm';
import { type NodePgTransaction } from 'drizzle-orm/node-postgres';
import { type PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { buchTable } from '../../db/schema.mts';
import { getLogger } from '../../logger/logger.mts';
import { type relations } from '../../db/relations.mts';

export type BuchUpdate = PgUpdateSetSource<typeof buchTable>;

const logger = getLogger('buch-update');

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
