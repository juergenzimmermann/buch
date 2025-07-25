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
import { InjectRepository } from '@nestjs/typeorm';
import { fileTypeFromBuffer } from 'file-type';
import { type DeleteResult, Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { MailService } from '../../mail/service.js';
import { Abbildung } from '../entity/abbildung.js';
import { Buch } from '../entity/buch.js';
import { BuchFile } from '../entity/file.js';
import { Titel } from '../entity/titel.js';
import {
    IsbnExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';
import { BuchService } from './service.js';

/** Typdefinitionen zum Aktualisieren eines Buches mit `update`. */
export type UpdateParams = {
    /** ID des zu aktualisierenden Buches. */
    readonly id: number | undefined;
    /** Buch-Objekt mit den aktualisierten Werten. */
    readonly buch: Buch;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
};

// TODO Transaktionen, wenn mehr als 1 TypeORM-Schreibmethode involviert ist
// https://docs.nestjs.com/techniques/database#typeorm-transactions
// https://papooch.github.io/nestjs-cls/plugins/available-plugins/transactional
// https://betterprogramming.pub/handling-transactions-in-typeorm-and-nest-js-with-ease-3a417e6ab5
// https://bytesmith.dev/blog/20240320-nestjs-transactions

/**
 * Die Klasse `BuchWriteService` implementiert den Anwendungskern für das
 * Schreiben von Bücher und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class BuchWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Buch>;

    readonly #fileRepo: Repository<BuchFile>;

    readonly #readService: BuchService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(BuchWriteService.name);

    // eslint-disable-next-line max-params
    constructor(
        @InjectRepository(Buch) repo: Repository<Buch>,
        @InjectRepository(BuchFile) fileRepo: Repository<BuchFile>,
        readService: BuchService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#fileRepo = fileRepo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Buch soll angelegt werden.
     * @param buch Das neu abzulegende Buch
     * @returns Die ID des neu angelegten Buches
     * @throws IsbnExists falls die ISBN-Nummer bereits existiert
     */
    async create(buch: Buch) {
        this.#logger.debug('create: buch=%o', buch);
        await this.#validateCreate(buch);

        const buchDb = await this.#repo.save(buch); // implizite Transaktion
        await this.#sendmail(buchDb);

        this.#logger.debug('create: buchDb.id=%d', buchDb.id);
        return buchDb.id!;
    }

    /**
     * Zu einem vorhandenen Buch ein3 Binärdatei mit z.B. einem Bild abspeichern.
     * @param buchId ID des vorhandenen Buches
     * @param data Bytes der Datei
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
    ): Promise<Readonly<BuchFile>> {
        this.#logger.debug(
            'addFile: buchId: %d, filename: %s, size: %d',
            buchId,
            filename,
            size,
        );

        // TODO Dateigroesse pruefen

        // Buch ermitteln, falls vorhanden
        const buch = await this.#readService.findById({ id: buchId });

        // evtl. vorhandene Datei loeschen
        await this.#fileRepo
            .createQueryBuilder('buch_file')
            .delete()
            .where('buch_id = :id', { id: buchId })
            .execute();

        const fileType = await fileTypeFromBuffer(data);
        const mimetype = fileType?.mime;
        this.#logger.debug('mimetype: %s', mimetype);
        // Entity-Objekt aufbauen, um es spaeter in der DB zu speichern (s.u.)
        const buchFile = this.#fileRepo.create({
            filename,
            data,
            mimetype,
            buch,
        });

        // Den Datensatz fuer Buch mit der neuen Binaerdatei aktualisieren
        await this.#repo.save({
            id: buch.id,
            file: buchFile,
        });

        this.#logger.debug(
            'addFile: id=%d, filename=%s',
            buchFile.id,
            buchFile.filename,
        );
        return buchFile;
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
            'update: id=%d, buch=%o, version=%s',
            id,
            buch,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(`Es gibt kein Buch mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(buch, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Buch)) {
            return validateResult;
        }

        const buchNeu = validateResult;
        const merged = this.#repo.merge(buchNeu, buch);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    /**
     * Ein Buch wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Buches
     * @returns true, falls das Buch vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const buch = await this.#readService.findById({
            id,
            mitAbbildungen: true,
        });

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Das Buch zur gegebenen ID mit Titel und Abb. asynchron loeschen

            // TODO "cascade" funktioniert nicht beim Loeschen
            const titelId = buch.titel?.id;
            if (titelId !== undefined) {
                await transactionalMgr.delete(Titel, titelId);
            }
            // "Nullish Coalescing" ab ES2020
            const abbildungen = buch.abbildungen ?? [];
            for (const abbildung of abbildungen) {
                await transactionalMgr.delete(Abbildung, abbildung.id);
            }

            deleteResult = await transactionalMgr.delete(Buch, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate({ isbn }: Buch): Promise<undefined> {
        this.#logger.debug('#validateCreate: isbn=%s', isbn);
        if (isbn === undefined) {
            this.#logger.debug('#validateCreate: ok');
            return;
        }

        if (await this.#repo.existsBy({ isbn })) {
            this.#logger.debug('#validateCreate: isbn existiert: %s', isbn);
            throw new IsbnExistsException(isbn);
        }
        this.#logger.debug('#validateCreate: ok');
    }

    async #sendmail(buch: Buch) {
        const subject = `Neues Buch ${buch.id}`;
        const titel = buch.titel?.titel ?? 'N/A';
        const body = `Das Buch mit dem Titel <strong>${titel}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(
        buch: Buch,
        id: number,
        versionStr: string,
    ): Promise<Buch> {
        this.#logger.debug(
            '#validateUpdate: buch=%o, id=%s, versionStr=%s',
            buch,
            id,
            versionStr,
        );
        if (!BuchWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: buch=%o, version=%d',
            buch,
            version,
        );

        const buchDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = buchDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: buchDb=%o', buchDb);
        return buchDb;
    }
}
