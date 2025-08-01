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
 * Das Modul besteht aus der Klasse {@linkcode BuchService}.
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { BuchFile } from '../entity/file.js';
import { Buch } from './../entity/buch.js';
import { type Pageable } from './pageable.js';
import { QueryBuilder } from './query-builder.js';
import { type Slice } from './slice.js';
import { type Suchparameter } from './suchparameter.js';

/**
 * Typdefinition für `findById`
 */
export type FindByIdParams = {
    /** ID des gesuchten Buchs */
    readonly id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    readonly mitAbbildungen?: boolean;
};

/**
 * Die Klasse `BuchService` implementiert das Lesen für Bücher und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class BuchService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #buchProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #repo: Repository<Buch>;

    readonly #fileRepo: Repository<BuchFile>;

    readonly #logger = getLogger(BuchService.name);

    constructor(
        queryBuilder: QueryBuilder,
        @InjectRepository(Buch) repo: Repository<Buch>,
        @InjectRepository(BuchFile) fileRepo: Repository<BuchFile>,
    ) {
        const buchDummy = new Buch();
        this.#buchProps = Object.getOwnPropertyNames(buchDummy);
        this.#queryBuilder = queryBuilder;
        this.#repo = repo;
        this.#fileRepo = fileRepo;
    }

    // Rueckgabetyp Promise bei asynchronen Funktionen
    //    ab ES2015
    //    vergleiche Task<> bei C#
    // Status eines Promise:
    //    Pending: das Resultat ist noch nicht vorhanden, weil die asynchrone
    //             Operation noch nicht abgeschlossen ist
    //    Fulfilled: die asynchrone Operation ist abgeschlossen und
    //               das Promise-Objekt hat einen Wert
    //    Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //              Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //              Im Promise-Objekt ist dann die Fehlerursache enthalten.

    /**
     * Ein Buch asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Buches
     * @returns Das gefundene Buch in einem Promise aus ES2015.
     * @throws NotFoundException falls kein Buch mit der ID existiert
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async findById({
        id,
        mitAbbildungen = false,
    }: FindByIdParams): Promise<Readonly<Buch>> {
        this.#logger.debug('findById: id=%d', id);

        // https://typeorm.io/working-with-repository
        // Das Resultat ist undefined, falls kein Datensatz gefunden
        // Lesen: Keine Transaktion erforderlich
        const buch = await this.#queryBuilder
            .buildId({ id, mitAbbildungen })
            .getOne();
        if (buch === null) {
            this.#logger.debug('Es gibt kein Buch mit der ID %d', id);
            throw new NotFoundException(`Es gibt kein Buch mit der ID ${id}.`);
        }
        if (buch.schlagwoerter === null) {
            buch.schlagwoerter = [];
        }

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: buch=%s, titel=%o',
                buch.toString(),
                buch.titel,
            );
            if (mitAbbildungen) {
                this.#logger.debug(
                    'findById: abbildungen=%o',
                    buch.abbildungen,
                );
            }
        }
        return buch;
    }

    /**
     * Binärdatei zu einem Buch suchen.
     * @param buchId ID des zugehörigen Buchs.
     * @returns Binärdatei oder undefined als Promise.
     */
    async findFileByBuchId(
        buchId: number,
    ): Promise<Readonly<BuchFile> | undefined> {
        this.#logger.debug('findFileByBuchId: buchId=%s', buchId);
        const buchFile = await this.#fileRepo
            .createQueryBuilder('buch_file')
            .where('buch_id = :id', { id: buchId })
            .getOne();
        if (buchFile === null) {
            this.#logger.debug('findFileByBuchId: Keine Datei gefunden');
            return;
        }

        this.#logger.debug('findFileByBuchId: filename=%s', buchFile.filename);
        return buchFile;
    }

    /**
     * Bücher asynchron suchen.
     * @param suchparameter JSON-Objekt mit Suchparameter.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns Ein JSON-Array mit den gefundenen Büchern.
     * @throws NotFoundException falls keine Bücher gefunden wurden.
     */
    async find(
        suchparameter: Suchparameter | undefined,
        pageable: Pageable,
    ): Promise<Slice<Buch>> {
        this.#logger.debug(
            'find: suchparameter=%o, pageable=%o',
            suchparameter,
            pageable,
        );

        // Keine Suchparameter?
        if (suchparameter === undefined) {
            return await this.#findAll(pageable);
        }
        const keys = Object.keys(suchparameter);
        if (keys.length === 0) {
            return await this.#findAll(pageable);
        }

        // Falsche Namen fuer Suchparameter?
        if (!this.#checkKeys(keys) || !this.#checkEnums(suchparameter)) {
            this.#logger.debug('Ungueltige Suchparameter');
            throw new NotFoundException('Ungueltige Suchparameter');
        }

        // QueryBuilder https://typeorm.io/select-query-builder
        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: Keine Transaktion erforderlich
        const queryBuilder = this.#queryBuilder.build(suchparameter, pageable);
        const buecher = await queryBuilder.getMany();
        if (buecher.length === 0) {
            this.#logger.debug('find: Keine Buecher gefunden');
            throw new NotFoundException(
                `Keine Buecher gefunden: ${JSON.stringify(suchparameter)}, Seite ${pageable.number}}`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(buecher, totalElements);
    }

    /**
     * Anzahl aller Bücher zurückliefern.
     * @returns Ein JSON-Array mit den gefundenen Büchern.
     */
    async count() {
        this.#logger.debug('count');
        const count = await this.#repo.count();
        this.#logger.debug('count: %d', count);
        return count;
    }

    async #findAll(pageable: Pageable) {
        const queryBuilder = this.#queryBuilder.build({}, pageable);
        const buecher = await queryBuilder.getMany();
        if (buecher.length === 0) {
            this.#logger.debug('#findAll: Keine Buecher gefunden');
            throw new NotFoundException(
                `Ungueltige Seite "${pageable.number}"`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(buecher, totalElements);
    }

    #createSlice(buecher: Buch[], totalElements: number) {
        buecher.forEach((buch) => {
            if (buch.schlagwoerter === null) {
                buch.schlagwoerter = [];
            }
        });
        const buchSlice: Slice<Buch> = {
            content: buecher,
            totalElements,
        };
        this.#logger.debug('createSlice: buchSlice=%o', buchSlice);
        return buchSlice;
    }

    #checkKeys(keys: string[]) {
        this.#logger.debug('#checkKeys: keys=%s', keys);
        // Ist jeder Suchparameter auch eine Property von Buch oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#buchProps.includes(key) &&
                key !== 'javascript' &&
                key !== 'typescript' &&
                key !== 'java' &&
                key !== 'python'
            ) {
                this.#logger.debug(
                    '#checkKeys: ungueltiger Suchparameter "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }

    #checkEnums(suchparameter: Suchparameter) {
        const { art } = suchparameter;
        this.#logger.debug('#checkEnums: Suchparameter "art=%s"', art);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return (
            art === undefined ||
            art === 'EPUB' ||
            art === 'HARDCOVER' ||
            art === 'PAPERBACK'
        );
    }
}
