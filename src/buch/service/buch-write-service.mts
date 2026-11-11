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
 * Das Modul besteht aus Funktionen für die Schreiboperationen mit Büchern.
 * @packageDocumentation
 */

import {
    type AbbildungInsert,
    type BuchInsert,
    type InsertType,
    type TitelInsert,
    insertAbbildung,
    insertBuch,
    insertTitel,
} from '../repository/buch-insert.mts';
import { type BuchNeuType, type BuchUpdateType } from '../validation/buch-validation.mts';
import { IsbnExistsError, NotFoundError, VersionOutdatedError } from './errors.mts';
import { deleteBuchFile, insertBuchFile } from '../repository/buch-file.mts';
import { existsISBN, existsId, selectVersionById } from '../repository/buch-select.mts';
import { db } from '../../config/db.mts';
import { deleteBuch } from '../repository/buch-delete.mts';
import { getLogger } from '../../logger/logger.mts';
import { sendmail } from '../../mail/sendmail.mts';
import { updateBuch } from '../repository/buch-update.mts';

const logger = getLogger('buch-write-service');

/**
 * Error-Klasse für internen Fehler.
 */
export class InternalServerError extends Error {}

// =============================================================================
// I N S E R T
// =============================================================================
const buchNeuToInsert = (buchNeu: BuchNeuType): InsertType => {
    const { titel, abbildungen, preis, rabatt, ...buchTmp } = buchNeu;
    const titelInsert: TitelInsert = titel;
    const abbildungenInsert: AbbildungInsert[] | undefined = abbildungen;
    const preisStr = preis.toString();
    const rabattStr = String(rabatt);

    const buchInsert: BuchInsert = { ...buchTmp, preis: preisStr, rabatt: rabattStr };
    return abbildungenInsert === undefined
        ? { buch: buchInsert, titel: titelInsert }
        : { buch: buchInsert, titel: titelInsert, abbildungen: abbildungenInsert };
};

const sendmailFn = async (id: number, titel: string) => {
    const subject = `Neues Buch ${id}`;
    // Sonderzeichen fuer HTML maskieren
    const titelEscaped = titel.replace(
        /[&<>"']/gu,
        (character) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character] as string,
    );
    const body = `Das Buch mit dem Titel <strong>${titelEscaped}</strong> ist angelegt`;

    await sendmail({ subject, body });
};

/**
 * Ein neues Buch soll angelegt werden.
 * @param buchNeu Das neu abzulegende Buch
 * @returns Die ID des neu angelegten Buches
 * @throws IsbnExists falls die ISBN-Nummer bereits existiert
 */
export const insert = async (buchNeu: BuchNeuType) => {
    logger.debug('create: buchNeu=%o', buchNeu);
    const { isbn } = buchNeu;
    if (await existsISBN(isbn)) {
        throw new IsbnExistsError(isbn);
    }

    const { buch, titel, abbildungen } = buchNeuToInsert(buchNeu);

    // Neuer Datensatz mit generierter ID
    const buchId = await db.transaction(async (tx) => {
        // https://orm.drizzle.team/docs/insert
        // Destructuring
        const buchIdTmp = await insertBuch(buch, tx);
        if (buchIdTmp === undefined) {
            throw new InternalServerError(
                `Das Buch ${JSON.stringify(buch)} wurde nicht eingefuegt.`,
            );
        }

        const titelId = await insertTitel(titel, buchIdTmp, tx);
        if (titelId === undefined) {
            throw new InternalServerError(
                `Der Titel ${JSON.stringify(titel)} wurde nicht eingefuegt.`,
            );
        }
        logger.debug('ID neuer Titel: %d', titelId);

        if (abbildungen !== undefined) {
            await Promise.all(
                abbildungen?.map(async (abbildung) => {
                    const abbildungId = await insertAbbildung(abbildung, buchIdTmp, tx);
                    if (abbildungId === undefined) {
                        throw new Error(
                            `Die Abbildung ${JSON.stringify(abbildung)} wurde nicht eingefuegt.`,
                        );
                    }
                    logger.debug('ID neue Abbildung: %d', abbildungId);
                }),
            );
        }

        return buchIdTmp;
    });

    await sendmailFn(buchId, titel.titel);

    logger.debug('create: dbId=%d', buchId);
    return buchId;
};

// =============================================================================
// U P D A T E
// =============================================================================
const checkLatestVersion = async (id: number, version: number) => {
    logger.debug('checkLatestVersion: id=%d, version=%s', id, version);

    const versionDb = await selectVersionById(id);
    if (versionDb === undefined) {
        logger.debug('Es gibt kein Buch mit der ID %d', id);
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
    }

    if (version !== versionDb) {
        logger.debug('checkLatestVersion: versionDb=%d (outdated)', versionDb);
        throw new VersionOutdatedError(version);
    }

    logger.debug('checkLatestVersion: versionDb=%d (ok)', versionDb);
    return versionDb;
};

/**
 * Ein vorhandenes Buch soll aktualisiert werden.
 * @param id ID des zu aktualisierenden Buchs
 * @param buch Neue Daten für das Buch
 * @param version Versionsnummer des Buchs
 * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
 * @throws NotFoundException falls kein Buch zur ID vorhanden ist
 * @throws VersionInvalidException falls die Versionsnummer ungültig ist
 * @throws VersionOutdatedException falls die Versionsnummer veraltet ist
 */
export const update = async (id: number, buch: BuchUpdateType, version: number) => {
    logger.debug('update: id=%s, buch=%o, version=%s', id, buch, version);
    if (id === undefined) {
        logger.debug('update: Keine gueltige ID');
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
    }

    const versionDB = await checkLatestVersion(id, version);
    logger.debug('update: versionDB=%d', versionDB);

    const { preis, rabatt } = buch;
    const neueVersion = await db.transaction(async (tx) => {
        const preisStr = preis.toString();
        const rabattStr = String(rabatt);
        return await updateBuch(
            id,
            { ...buch, preis: preisStr, rabatt: rabattStr },
            version + 1,
            tx,
        );
    });

    logger.debug('update: neueVersion=%d', neueVersion);
    return neueVersion;
};

// =============================================================================
// D E L E T E
// =============================================================================
/**
 * Ein Buch wird asynchron anhand seiner ID gelöscht.
 *
 * @param id ID des zu löschenden Buches
 * @returns true, falls das Buch vorhanden war und gelöscht wurde. Sonst false.
 */
export const deleteFn = async (id: number) => {
    logger.debug('delete: id=%d', id);

    if (!(await existsId(id))) {
        return false;
    }

    const deleted = await db.transaction(
        async (tx) =>
            // https://orm.drizzle.team/docs/delete
            // "CREATE TABLE" mit "ON DELETE CASCADE"
            await deleteBuch(id, tx),
    );

    logger.debug('delete: %s', deleted);
    return deleted;
};

// =============================================================================
// B I N A E R D A T E I   S P E I C H E R N
// =============================================================================
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
