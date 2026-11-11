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
import { buchFileTable } from '../../db/schema.mts';
import { db } from '../../config/db.mts';
import { eq } from 'drizzle-orm';
import { getLogger } from '../../logger/logger.mts';
import { type relations } from '../../db/relations.mts';

export type BuchFileInsert = typeof buchFileTable.$inferInsert;
export type BuchFileSelect = typeof buchFileTable.$inferSelect;

const logger = getLogger('buch-file');

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
