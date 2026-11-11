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
 * Das Modul besteht aus Funktionen für die Suche nach Büchern.
 * @packageDocumentation
 */

import { deleteBuchFile, insertBuchFile, selectFileByBuchId } from '../repository/buch-file.mts';
import { InternalServerError } from './buch-write-service.mts';
import { NotFoundError } from './errors.mts';
import { buchFileTable } from '../../db/schema.mts';
import { db } from '../../config/db.mts';
import { existsId } from '../repository/buch-select.mts';
import { getLogger } from '../../logger/logger.mts';

const logger = getLogger('buch-service-file');

export type BuchFileSelect = typeof buchFileTable.$inferSelect;

/**
 * Binärdatei zu einem Buch suchen.
 * @param buchId ID des zugehörigen Buchs.
 * @returns Binärdatei oder undefined als Promise.
 */
export const findFileByBuchId = async (
    buchId: number,
): Promise<Readonly<BuchFileSelect> | undefined> => {
    logger.debug('findFileByBuchId: buchId=%d', buchId);
    const buchFile = await selectFileByBuchId(buchId);
    if (buchFile === undefined) {
        logger.debug('findFileByBuchId: Keine Datei gefunden');
        return;
    }

    logger.debug(
        'findFileByBuchId: id=%s, byteLength=%d, filename=%s, mimetype=%s, buchId=%d',
        buchFile.id,
        (buchFile.data as Uint8Array<ArrayBuffer>).byteLength,
        buchFile.filename,
        buchFile.mimetype,
        buchFile.buchId,
    );

    // als Datei im Wurzelverzeichnis des Projekts speichern:
    // import { writeFile } from 'node:fs/promises';
    // await writeFile(buchFile.filename, buchFile.data);

    return buchFile;
};

/**
 * Zu einem vorhandenen Buch eine Binärdatei mit z.B. einem Bild abspeichern.
 * @param buchId ID des vorhandenen Buches
 * @param data Bytes der Datei als Buffer Node
 * @param name Dateiname
 * @param size Dateigröße in Bytes
 * @param type MIME-Typ, z.B. image/png
 * @returns Entity-Objekt für `BuchFile`
 */
// oxlint-disable-next-line max-params
export const addFile = async (
    buchId: number,
    data: Buffer,
    size: number,
    filename: string,
    mimetype: string,
): Promise<Readonly<number>> => {
    logger.debug(
        'addFile: buchId=%d, size=%d, filename=%s, mimetype=%s',
        buchId,
        size,
        filename,
        mimetype,
    );

    // TODO Dateigroesse pruefen

    // Buch ermitteln, falls vorhanden
    if (!(await existsId(buchId))) {
        logger.debug('Es gibt kein Buch mit der ID %d', buchId);
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${buchId}.`);
    }

    const idResult = await db.transaction(async (tx) => {
        // evtl. vorhandene Datei löschen
        await deleteBuchFile(buchId, tx);
        return await insertBuchFile(data, filename, mimetype, buchId, tx);
    });
    if (idResult === undefined) {
        throw new InternalServerError(`Fehler beim INSERT von ${name}`);
    }

    const { id } = idResult;
    logger.debug('addFile: id=%d', id);
    return id;
};
