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
 * Das Modul besteht aus der Klasse {@linkcode BuchService}.
 * @packageDocumentation
 */

import { type BuchFile, type Prisma } from '../../generated/prisma/client.ts';
import { type Suchparameter, suchparameterNamen } from './suchparameter.mts';
import { type BuchInclude } from '../../generated/prisma/models/Buch.ts';
import { NotFoundError } from './errors.mts';
import { type Pageable } from './pageable.mts';
import { type Slice } from './slice.mts';
import { buildWhere } from './where-builder.mts';
import { getLogger } from '../../logger/logger.mts';
import { prismaClient } from '../../config/prisma-client.mts';

// Typdefinition für `findById`
type FindByIdParams = {
    // ID des gesuchten Buchs
    readonly id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    readonly mitAbbildungen?: boolean;
};

export type BuchMitTitel = Prisma.BuchGetPayload<{
    include: { titel: true };
}>;

// "preis" und "rabatt" sind vom Prisma-internen Typ "Decimal"
export type BuchMitTitelDTO = Omit<BuchMitTitel, 'preis' | 'rabatt'> & {
    preis: number;
    rabatt: number;
};

export type BuchMitTitelUndAbbildungen = Prisma.BuchGetPayload<{
    include: {
        titel: true;
        abbildungen: true;
    };
}>;

// "preis" und "rabatt" sind vom Prisma-internen Typ "Decimal"
export type BuchMitTitelUndAbbildungenDTO = Omit<
    BuchMitTitelUndAbbildungen,
    'preis' | 'rabatt'
> & {
    preis: number;
    rabatt: number;
};

/**
 * Die Klasse `BuchService` implementiert das Lesen für Bücher und greift
 * mit _Prisma_ auf eine relationale DB zu.
 */
export class BuchService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #includeTitel: BuchInclude = { titel: true };
    readonly #includeTitelUndAbbildungen: BuchInclude = {
        titel: true,
        abbildungen: true,
    };

    readonly #logger = getLogger(BuchService.name);

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
     * @throws NotFoundError falls kein Buch mit der ID existiert
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async findById({
        id,
        mitAbbildungen,
    }: FindByIdParams): Promise<Readonly<BuchMitTitelUndAbbildungenDTO>> {
        this.#logger.debug('findById: id=%d', id);

        // Das Resultat ist null, falls kein Datensatz gefunden
        // Lesen: Keine Transaktion erforderlich
        // "include":
        // - referenzierte Daten werden mitgeladen
        // - keine Konfiguration fuer Eager- oder Lazy-Fetching
        // - keine Proxy-Objekte durch evtl. Lazy-Fetching
        // - keine DTO-Klassen mit weggelassenen nicht geladenen Properties
        const include = mitAbbildungen
            ? this.#includeTitelUndAbbildungen
            : this.#includeTitel;
        const buch: BuchMitTitelUndAbbildungen | null =
            await prismaClient.buch.findUnique({
                where: { id },
                include,
            });
        if (buch === null) {
            this.#logger.debug('Es gibt kein Buch mit der ID %d', id);
            throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
        }
        // nullish coalescing operator
        buch.schlagwoerter ??= [];

        const { preis, rabatt, ...buchRest } = buch;
        const buchDTO: BuchMitTitelUndAbbildungenDTO = {
            ...buchRest,
            preis: preis.toNumber(),
            rabatt: rabatt.toNumber(),
        };

        this.#logger.debug('findById: buchDTO=%o', buchDTO);
        return buchDTO;
    }

    /**
     * Binärdatei zu einem Buch suchen.
     * @param buchId ID des zugehörigen Buchs.
     * @returns Binärdatei oder undefined als Promise.
     */
    async findFileByBuchId(
        buchId: number,
    ): Promise<Readonly<BuchFile> | undefined> {
        this.#logger.debug('findFileByBuchId: buchId=%d', buchId);
        const buchFile: BuchFile | null =
            await prismaClient.buchFile.findUnique({ where: { buchId } });
        if (buchFile === null) {
            this.#logger.debug('findFileByBuchId: Keine Datei gefunden');
            return;
        }

        this.#logger.debug(
            'findFileByBuchId: id=%s, byteLength=%d, filename=%s, mimetype=%s, buchId=%d',
            buchFile.id,
            buchFile.data.byteLength,
            buchFile.filename,
            buchFile.mimetype,
            buchFile.buchId,
        );

        // als Datei im Wurzelverzeichnis des Projekts speichern:
        // import { writeFile } from 'node:fs/promises';
        // await writeFile(buchFile.filename, buchFile.data);

        return buchFile;
    }

    /**
     * Bücher asynchron suchen.
     * @param suchparameter JSON-Objekt mit Suchparameter.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns Ein JSON-Array mit den gefundenen Büchern.
     * @throws NotFoundError falls keine Bücher gefunden wurden.
     */
    async find(
        suchparameter: Suchparameter | null,
        pageable: Pageable,
    ): Promise<Readonly<Slice<Readonly<BuchMitTitelDTO>>>> {
        this.#logger.debug(
            'find: suchparameter=%s, pageable=%o',
            JSON.stringify(suchparameter),
            pageable,
        );

        // Keine Suchparameter?
        if (suchparameter === null) {
            return await this.#findAll(pageable);
        }
        const keys = Object.keys(suchparameter);
        if (keys.length === 0) {
            return await this.#findAll(pageable);
        }

        // Falsche Namen fuer Suchparameter?
        if (!this.#checkKeys(keys) || !this.#checkEnums(suchparameter)) {
            this.#logger.debug('Ungueltige Suchparameter');
            throw new NotFoundError('Ungueltige Suchparameter');
        }

        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: Keine Transaktion erforderlich
        const where = buildWhere(suchparameter);
        const { number, size } = pageable;
        const buecher: BuchMitTitel[] = await prismaClient.buch.findMany({
            where,
            skip: number * size,
            take: size,
            include: this.#includeTitel,
        });
        if (buecher.length === 0) {
            this.#logger.debug('find: Keine Buecher gefunden');
            throw new NotFoundError(
                `Keine Buecher gefunden: ${JSON.stringify(suchparameter)}, Seite ${pageable.number}}`,
            );
        }
        const totalElements = await this.count(where);
        return this.#createSlice(buecher, totalElements);
    }

    /**
     * Anzahl der gefundenen Bücher zurückliefern.
     * @param WHERE-Klausel der eigentlichen Suche.
     * @returns Anzahl der gefundenen Bücher.
     */
    async count(where?: Prisma.BuchWhereInput) {
        this.#logger.debug('count: where=%o', where ?? 'undefined');
        const { count } = prismaClient.buch;
        const anzahl =
            typeof where === 'undefined'
                ? await count()
                : await count({ where });
        this.#logger.debug('count: %d', anzahl);
        return anzahl;
    }

    async #findAll(
        pageable: Pageable,
    ): Promise<Readonly<Slice<BuchMitTitelDTO>>> {
        const { number, size } = pageable;
        const buecher: BuchMitTitel[] = await prismaClient.buch.findMany({
            skip: number * size,
            take: size,
            include: this.#includeTitel,
        });
        if (buecher.length === 0) {
            this.#logger.debug('#findAll: Keine Buecher gefunden');
            throw new NotFoundError(`Ungueltige Seite "${number}"`);
        }
        const totalElements = await this.count();
        return this.#createSlice(buecher, totalElements);
    }

    #createSlice(
        buecher: BuchMitTitel[],
        totalElements: number,
    ): Readonly<Slice<BuchMitTitelDTO>> {
        const buecherDTO = buecher.map((buch) => {
            const { preis, rabatt, ...buchRest } = buch;
            const buchDTO: BuchMitTitelDTO = {
                ...buchRest,
                preis: preis.toNumber(),
                rabatt: rabatt.toNumber(),
            };
            buchDTO.schlagwoerter = buch.schlagwoerter ?? [];
            return buchDTO;
        });
        const buchSlice: Slice<BuchMitTitelDTO> = {
            content: buecherDTO,
            totalElements,
        };
        this.#logger.debug('createSlice: buchSlice=%o', buchSlice);
        return buchSlice;
    }

    #checkKeys(keys: string[]) {
        this.#logger.debug('#checkKeys: keys=%o', keys);
        // Ist jeder Suchparameter auch eine Property von Buch oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !suchparameterNamen.includes(key) &&
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
        return (
            typeof art === 'undefined' ||
            art === 'EPUB' ||
            art === 'HARDCOVER' ||
            art === 'PAPERBACK'
        );
    }
}
