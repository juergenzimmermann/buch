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

import { type BuchFile, type Prisma } from '../../generated/prisma/client.ts';
import {
    IsbnExistsError,
    NotFoundError,
    VersionInvalidError,
    VersionOutdatedError,
} from './errors.mts';
import { findById } from './buch-service.mts';
import { getLogger } from '../../logger/logger.mts';
import { prismaClient } from '../../config/prisma-client.mts';
import { sendmail } from '../../mail/sendmail.mts';

export type BuchCreate = Prisma.BuchCreateInput;
type BuchCreated = Prisma.BuchGetPayload<{
    include: {
        titel: true;
        abbildungen: true;
    };
}>;

export type BuchUpdate = Prisma.BuchUpdateInput;
/** Typdefinitionen zum Aktualisieren eines Buches mit `update`. */
export type UpdateParams = {
    /** ID des zu aktualisierenden Buches. */
    readonly id: number | undefined;
    /** Buch-Objekt mit den aktualisierten Werten. */
    readonly buch: BuchUpdate;
    /** Versionsnummer für die zu aktualisierenden Werte. */
    readonly version: string;
};
type BuchUpdated = Prisma.BuchGetPayload<{}>;

type BuchFileCreate = Prisma.BuchFileUncheckedCreateInput;
export type BuchFileCreated = Prisma.BuchFileGetPayload<{}>;

const VERSION_PATTERN = /^"\d{1,3}"/u;

const logger = getLogger('buch-write-service');

// =============================================================================
// C R E A T E
// =============================================================================
const validateCreate = async ({
    isbn,
}: Prisma.BuchCreateInput): Promise<undefined> => {
    logger.debug('#validateCreate: isbn=%s', isbn);
    if (isbn === undefined) {
        logger.debug('#validateCreate: ok');
        return;
    }

    const anzahl = await prismaClient.buch.count({ where: { isbn } });
    if (anzahl > 0) {
        logger.debug('#validateCreate: isbn existiert: %s', isbn);
        throw new IsbnExistsError(isbn);
    }
    logger.debug('#validateCreate: ok');
};

const sendmailFn = async ({
    id,
    titel,
}: {
    id: number | 'N/A';
    titel: string;
}) => {
    const subject = `Neues Buch ${id}`;
    const body = `Das Buch mit dem Titel <strong>${titel}</strong> ist angelegt`;

    await sendmail({ subject, body });
};

/**
 * Ein neues Buch soll angelegt werden.
 * @param buch Das neu abzulegende Buch
 * @returns Die ID des neu angelegten Buches
 * @throws IsbnExists falls die ISBN-Nummer bereits existiert
 */
export const create = async (buch: BuchCreate) => {
    logger.debug('create: buch=%o', buch);
    await validateCreate(buch);

    // Neuer Datensatz mit generierter ID
    let buchDb: BuchCreated | undefined;
    await prismaClient.$transaction(async (tx) => {
        buchDb = await tx.buch.create({
            data: buch,
            include: { titel: true, abbildungen: true },
        });
    });
    await sendmailFn({
        id: buchDb?.id ?? 'N/A',
        titel: buchDb?.titel?.titel ?? 'N/A',
    });

    logger.debug('create: buchDb.id=%s', buchDb?.id);
    return buchDb?.id ?? Number.NaN;
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
    name: string,
    size: number,
    type: string,
): Promise<Readonly<BuchFile> | undefined> => {
    logger.debug(
        'addFile: buchId=%d, filename=%s, size=%d',
        buchId,
        name,
        size,
    );

    // TODO Dateigroesse pruefen

    let buchFileCreated: BuchFileCreated | undefined;
    await prismaClient.$transaction(async (tx) => {
        // Buch ermitteln, falls vorhanden
        const buch = await tx.buch.findUnique({
            where: { id: buchId },
        });
        if (buch === null) {
            logger.debug('Es gibt kein Buch mit der ID %d', buchId);
            throw new NotFoundError(`Es gibt kein Buch mit der ID ${buchId}.`);
        }

        // evtl. vorhandene Datei löschen
        await tx.buchFile.deleteMany({ where: { buchId } });

        const buchFile: BuchFileCreate = {
            filename: name,
            data: data as Uint8Array<ArrayBuffer>,
            mimetype: type,
            buchId,
        };
        buchFileCreated = await tx.buchFile.create({ data: buchFile });
    });

    logger.debug(
        'addFile: id=%s, byteLength=%s, filename=%s, mimetype=%s',
        buchFileCreated?.id,
        buchFileCreated?.data.byteLength,
        buchFileCreated?.filename,
        buchFileCreated?.mimetype,
    );
    return buchFileCreated;
};

// =============================================================================
// U P D A T E
// =============================================================================
const validateUpdate = async (id: number, versionStr: string) => {
    logger.debug('#validateUpdate: id=%d, versionStr=%s', id, versionStr);
    if (!VERSION_PATTERN.test(versionStr)) {
        throw new VersionInvalidError(versionStr);
    }

    const version = Number.parseInt(versionStr.slice(1, -1), 10);
    const buchDb = await findById({ id });

    if (version < buchDb.version) {
        logger.debug('#validateUpdate: versionDb=%d', version);
        throw new VersionOutdatedError(version);
    }
};

/**
 * Ein vorhandenes Buch soll aktualisiert werden. "Destructured" Argument
 * mit id (ID des zu aktualisierenden Buchs), buch (zu aktualisierendes Buch)
 * und version (Versionsnummer für optimistische Synchronisation).
 * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
 * @throws NotFoundException falls kein Buch zur ID vorhanden ist
 * @throws VersionInvalidException falls die Versionsnummer ungültig ist
 * @throws VersionOutdatedException falls die Versionsnummer veraltet ist
 */
// https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
export const update = async ({ id, buch, version }: UpdateParams) => {
    logger.debug('update: id=%s, buch=%o, version=%s', id, buch, version);
    if (id === undefined) {
        logger.debug('update: Keine gueltige ID');
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
    }

    await validateUpdate(id, version);

    buch.version = { increment: 1 };
    let buchUpdated: BuchUpdated | undefined;
    await prismaClient.$transaction(async (tx) => {
        buchUpdated = await tx.buch.update({
            data: buch,
            where: { id },
        });
    });
    logger.debug('update: buchUpdated=%s', JSON.stringify(buchUpdated));

    return buchUpdated?.version ?? Number.NaN;
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

    const buch = await prismaClient.buch.findUnique({
        where: { id },
    });
    if (buch === null) {
        logger.debug('delete: not found');
        return false;
    }

    await prismaClient.$transaction(async (tx) => {
        await tx.buch.delete({ where: { id } });
    });

    logger.debug('delete');
    return true;
};
