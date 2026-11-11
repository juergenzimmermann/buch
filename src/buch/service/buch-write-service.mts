// oxlint-disable max-lines
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

import { type BuchNeuType, type BuchUpdateType } from '../validation/buch-validation.mts';
import {
    IsbnExistsError,
    NotFoundError,
    VersionInvalidError,
    VersionOutdatedError,
} from './errors.mts';
import { abbildungTable, buchFileTable, buchTable, titelTable } from '../../db/schema.mts';
import { count, eq, sql } from 'drizzle-orm';
import { selectExistsById, selectVersionById } from '../repository/repository.mts';
import { db } from '../../config/db.mts';
import { getLogger } from '../../logger/logger.mts';
import { sendmail } from '../../mail/sendmail.mts';

const logger = getLogger('buch-write-service');

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
export type BuchFileInsert = typeof buchFileTable.$inferInsert;

const VERSION_PATTERN = /^"\d{1,3}"/u;

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

const checkUniqueISBN = async (isbn: string): Promise<undefined> => {
    logger.debug('checkUniqueISBN: isbn=%s', isbn);

    const [row] = await db
        .select({ count: count() })
        .from(buchTable)
        .where(eq(buchTable.isbn, isbn));
    if (row?.count === 0) {
        logger.debug('checkUniqueISBN: ok');
        return;
    }

    logger.debug('checkUniqueISBN: isbn %s existiert', isbn);
    throw new IsbnExistsError(isbn);
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
    await checkUniqueISBN(buchNeu.isbn);

    const { buch, titel, abbildungen } = buchNeuToInsert(buchNeu);

    // Neuer Datensatz mit generierter ID
    const buchId = await db.transaction(async (tx) => {
        // https://orm.drizzle.team/docs/insert
        // Destructuring
        const [buchInsert] = await tx
            .insert(buchTable)
            .values(buch)
            .returning({ id: buchTable.id });
        if (buchInsert === undefined) {
            throw new InternalServerError(`Das Buch ${buch} wurde nicht eingefuegt.`);
        }
        const buchIdTmp = buchInsert.id;

        const [titelInsert] = await tx
            .insert(titelTable)
            .values({ ...titel, buchId: buchIdTmp })
            .returning({ id: titelTable.id });
        if (titelInsert === undefined) {
            throw new InternalServerError(`Der Titel ${titel} wurde nicht eingefuegt.`);
        }
        logger.debug('ID neuer Titel: %d', titelInsert.id);

        if (abbildungen !== undefined) {
            await Promise.all(
                abbildungen?.map(async (abbildung) => {
                    const [abbildungInsert] = await tx
                        .insert(abbildungTable)
                        .values({ ...abbildung, buchId: buchIdTmp })
                        .returning({ id: abbildungTable.id });
                    if (abbildungInsert === undefined) {
                        throw new Error('Die Abbildung wurde nicht eingefuegt.');
                    }
                    logger.debug('ID neue Abbildung: %d', abbildungInsert.id);
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
const checkLatestVersion = async (id: number, versionStr: string) => {
    logger.debug('checkLatestVersion: id=%d, versionStr=%s', id, versionStr);
    if (!VERSION_PATTERN.test(versionStr)) {
        throw new VersionInvalidError(versionStr);
    }

    const version = Number.parseInt(versionStr.slice(1, -1), 10);
    const versionDb = await selectVersionById(id);
    if (versionDb === undefined) {
        logger.debug('Es gibt kein Buch mit der ID %d', id);
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
    }

    if (version < versionDb) {
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
export const update = async (id: number, buch: BuchUpdateType, version: string) => {
    logger.debug('update: id=%s, buch=%o, version=%s', id, buch, version);
    if (id === undefined) {
        logger.debug('update: Keine gueltige ID');
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
    }

    const versionDB = await checkLatestVersion(id, version);
    logger.debug('update: versionDB=%d', versionDB);

    const { preis, rabatt, ...buchOhnePreisRabatt } = buch;
    const [updated] = await db.transaction(
        async (tx) =>
            // https://orm.drizzle.team/docs/update
            await tx
                .update(buchTable)
                .set({
                    // Spread-Operator
                    ...buchOhnePreisRabatt,
                    version: versionDB + 1,
                    preis: preis.toString(),
                    rabatt: String(rabatt),
                    // Funktion "now" von SQL durch den Template-String aufrufen
                    aktualisiert: sql`now()`,
                })
                .where(eq(buchTable.id, id))
                .returning({ version: buchTable.version }),
    );

    const versionUpdated = updated === undefined ? Number.NaN : updated.version;
    logger.debug('update: versionUpdated=%s', versionUpdated);

    return versionUpdated;
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

    const exists = await selectExistsById(id);
    if (!exists) {
        return false;
    }

    let deleted = false;
    await db.transaction(async (tx) => {
        // https://orm.drizzle.team/docs/delete
        // "CREATE TABLE" mit "ON DELETE CASCADE"
        const [idDelete] = await tx
            .delete(buchTable)
            .where(eq(buchTable.id, id))
            .returning({ id: buchTable.id });
        deleted = idDelete !== undefined;
    });

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
    name: string,
    size: number,
    type: string,
): Promise<Readonly<BuchFileInsert>> => {
    logger.debug('addFile: buchId=%d, filename=%s, size=%d', buchId, name, size);

    // TODO Dateigroesse pruefen

    // Buch ermitteln, falls vorhanden
    if (!(await selectExistsById(buchId))) {
        logger.debug('Es gibt kein Buch mit der ID %d', buchId);
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${buchId}.`);
    }

    const buchFileInsert = await db.transaction(async (tx) => {
        // evtl. vorhandene Datei löschen
        await tx.delete(buchFileTable).where(eq(buchFileTable.buchId, buchId)).returning();

        const buchFile: BuchFileInsert = {
            filename: name,
            data: data as Uint8Array<ArrayBuffer>,
            mimetype: type,
            buchId,
        };
        const [result] = await tx.insert(buchFileTable).values(buchFile).returning();
        return result;
    });

    if (buchFileInsert === undefined) {
        throw new InternalServerError(`Fehler beim INSERT von ${name}`);
    }

    logger.debug(
        'addFile: id=%s, byteLength=%s, filename=%s, mimetype=%s',
        buchFileInsert.id,
        (buchFileInsert.data as Uint8Array<ArrayBuffer>).byteLength,
        buchFileInsert.filename,
        buchFileInsert.mimetype,
    );
    return buchFileInsert;
};
