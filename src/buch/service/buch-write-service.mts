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
 * Das Modul besteht aus der Klasse {@linkcode BuchWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { prismaClient } from '../../config/prisma-client.mts';
import { type BuchFile, type Prisma } from '../../generated/prisma/client.ts';
import { getLogger } from '../../logger/logger.mts';
import { sendmail } from '../../mail/sendmail.mts';
import { BuchService } from './buch-service.mts';
import {
    IsbnExistsError,
    NotFoundError,
    VersionInvalidError,
    VersionOutdatedError,
} from './errors.mts';

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

/**
 * Die Klasse `BuchWriteService` implementiert den Anwendungskern für das
 * Schreiben von Bücher und greift mit _Prisma_ auf die DB zu.
 */
export class BuchWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #readService: BuchService;

    readonly #logger = getLogger(BuchWriteService.name);

    // eslint-disable-next-line max-params
    constructor(readService: BuchService) {
        this.#readService = readService;
    }

    /**
     * Ein neues Buch soll angelegt werden.
     * @param buch Das neu abzulegende Buch
     * @returns Die ID des neu angelegten Buches
     * @throws IsbnExists falls die ISBN-Nummer bereits existiert
     */
    async create(buch: BuchCreate) {
        this.#logger.debug('create: buch=%o', buch);
        await this.#validateCreate(buch);

        // Neuer Datensatz mit generierter ID
        let buchDb: BuchCreated | undefined;
        await prismaClient.$transaction(async (tx) => {
            buchDb = await tx.buch.create({
                data: buch,
                include: { titel: true, abbildungen: true },
            });
        });
        await this.#sendmail({
            id: buchDb?.id ?? 'N/A',
            titel: buchDb?.titel?.titel ?? 'N/A',
        });

        this.#logger.debug('create: buchDb.id=%s', buchDb?.id);
        return buchDb?.id ?? Number.NaN;
    }

    /**
     * Zu einem vorhandenen Buch eine Binärdatei mit z.B. einem Bild abspeichern.
     * @param buchId ID des vorhandenen Buches
     * @param data Bytes der Datei als Buffer Node
     * @param name Dateiname
     * @param size Dateigröße in Bytes
     * @param type MIME-Typ, z.B. image/png
     * @returns Entity-Objekt für `BuchFile`
     */
    // eslint-disable-next-line max-params
    async addFile(
        buchId: number,
        data: Buffer,
        name: string,
        size: number,
        type: string,
    ): Promise<Readonly<BuchFile> | undefined> {
        this.#logger.debug(
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
                this.#logger.debug('Es gibt kein Buch mit der ID %d', buchId);
                throw new NotFoundError(
                    `Es gibt kein Buch mit der ID ${buchId}.`,
                );
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

        this.#logger.debug(
            'addFile: id=%s, byteLength=%s, filename=%s, mimetype=%s',
            buchFileCreated?.id,
            buchFileCreated?.data.byteLength,
            buchFileCreated?.filename,
            buchFileCreated?.mimetype,
        );
        return buchFileCreated;
    }

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
    async update({ id, buch, version }: UpdateParams) {
        this.#logger.debug(
            'update: id=%s, buch=%o, version=%s',
            id,
            buch,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
        }

        await this.#validateUpdate(id, version);

        buch.version = { increment: 1 };
        let buchUpdated: BuchUpdated | undefined;
        await prismaClient.$transaction(async (tx) => {
            buchUpdated = await tx.buch.update({
                data: buch,
                where: { id },
            });
        });
        this.#logger.debug(
            'update: buchUpdated=%s',
            JSON.stringify(buchUpdated),
        );

        return buchUpdated?.version ?? Number.NaN;
    }

    /**
     * Ein Buch wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Buches
     * @returns true, falls das Buch vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);

        const buch = await prismaClient.buch.findUnique({
            where: { id },
        });
        if (buch === null) {
            this.#logger.debug('delete: not found');
            return false;
        }

        await prismaClient.$transaction(async (tx) => {
            await tx.buch.delete({ where: { id } });
        });

        this.#logger.debug('delete');
        return true;
    }

    async #validateCreate({
        isbn,
    }: Prisma.BuchCreateInput): Promise<undefined> {
        this.#logger.debug('#validateCreate: isbn=%s', isbn);
        if (isbn === undefined) {
            this.#logger.debug('#validateCreate: ok');
            return;
        }

        const anzahl = await prismaClient.buch.count({ where: { isbn } });
        if (anzahl > 0) {
            this.#logger.debug('#validateCreate: isbn existiert: %s', isbn);
            throw new IsbnExistsError(isbn);
        }
        this.#logger.debug('#validateCreate: ok');
    }

    async #sendmail({ id, titel }: { id: number | 'N/A'; titel: string }) {
        const subject = `Neues Buch ${id}`;
        const body = `Das Buch mit dem Titel <strong>${titel}</strong> ist angelegt`;
        await sendmail({ subject, body });
    }

    async #validateUpdate(id: number, versionStr: string) {
        this.#logger.debug(
            '#validateUpdate: id=%d, versionStr=%s',
            id,
            versionStr,
        );
        if (!BuchWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidError(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        const buchDb = await this.#readService.findById({ id });

        if (version < buchDb.version) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedError(version);
        }
    }
}
