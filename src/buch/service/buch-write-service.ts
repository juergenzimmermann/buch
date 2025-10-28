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

import { Injectable, NotFoundException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import {
    BuchFile,
    type Prisma,
    PrismaClient,
} from '../../generated/prisma/client.js';
import { getLogger } from '../../logger/logger.js';
import { MailService } from '../../mail/mail-service.js';
import { BuchService } from './buch-service.js';
import {
    IsbnExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';
import { PrismaService } from './prisma-service.js';

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
@Injectable()
export class BuchWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #prisma: PrismaClient;

    readonly #readService: BuchService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(BuchWriteService.name);

    // eslint-disable-next-line max-params
    constructor(
        prisma: PrismaService,
        readService: BuchService,
        mailService: MailService,
    ) {
        this.#prisma = prisma.client;
        this.#readService = readService;
        this.#mailService = mailService;
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
        await this.#prisma.$transaction(async (tx) => {
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
     * @param filename Dateiname
     * @param size Dateigröße in Bytes
     * @returns Entity-Objekt für `BuchFile`
     */
    // eslint-disable-next-line max-params
    async addFile(
        buchId: number,
        data: Buffer,
        filename: string,
        size: number,
    ): Promise<Readonly<BuchFile> | undefined> {
        this.#logger.debug(
            'addFile: buchId=%d, filename=%s, size=%d',
            buchId,
            filename,
            size,
        );

        // TODO Dateigroesse pruefen

        let buchFileCreated: BuchFileCreated | undefined;
        await this.#prisma.$transaction(async (tx) => {
            // Buch ermitteln, falls vorhanden
            const buch = tx.buch.findUnique({
                where: { id: buchId },
            });
            if (buch === null) {
                this.#logger.debug('Es gibt kein Buch mit der ID %d', buchId);
                throw new NotFoundException(
                    `Es gibt kein Buch mit der ID ${buchId}.`,
                );
            }

            // evtl. vorhandene Datei löschen
            await tx.buchFile.deleteMany({ where: { buchId } });

            const fileType = await fileTypeFromBuffer(data);
            const mimetype = fileType?.mime ?? null;
            this.#logger.debug('addFile: mimetype=%s', mimetype);

            const buchFile: BuchFileCreate = {
                filename,
                data: data as Uint8Array<ArrayBuffer>,
                mimetype,
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
            throw new NotFoundException(`Es gibt kein Buch mit der ID ${id}.`);
        }

        await this.#validateUpdate(id, version);

        buch.version = { increment: 1 };
        let buchUpdated: BuchUpdated | undefined;
        await this.#prisma.$transaction(async (tx) => {
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

        const buch = await this.#prisma.buch.findUnique({
            where: { id },
        });
        if (buch === null) {
            this.#logger.debug('delete: not found');
            return false;
        }

        await this.#prisma.$transaction(async (tx) => {
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

        const anzahl = await this.#prisma.buch.count({ where: { isbn } });
        if (anzahl > 0) {
            this.#logger.debug('#validateCreate: isbn existiert: %s', isbn);
            throw new IsbnExistsException(isbn);
        }
        this.#logger.debug('#validateCreate: ok');
    }

    async #sendmail({ id, titel }: { id: number | 'N/A'; titel: string }) {
        const subject = `Neues Buch ${id}`;
        const body = `Das Buch mit dem Titel <strong>${titel}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(id: number, versionStr: string) {
        this.#logger.debug(
            '#validateUpdate: id=%d, versionStr=%s',
            id,
            versionStr,
        );
        if (!BuchWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        const buchDb = await this.#readService.findById({ id });

        if (version < buchDb.version) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
    }
}
