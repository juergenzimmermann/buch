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

import { type Suchparameter, suchparameterNamen } from '../repository/suchparameter.mts';
import { select, selectAll, selectById, selectByIdMitAbb } from '../repository/buch-select.mts';
import { BuchDTO } from './buch-dto.mts';
import { NotFoundError } from './errors.mts';
import { type Pageable } from '../repository/pageable.mts';
import { type Slice } from './slice.mts';
import { getLogger } from '../../logger/logger.mts';

// Rueckgabetyp Promise bei asynchronen Funktionen
//    ab ES2015
//    vergleiche Task<> bei C#
// Status eines Promise:
//    Pending:   das Resultat ist noch nicht vorhanden, weil die asynchrone
//               Operation noch nicht abgeschlossen ist
//    Fulfilled: die asynchrone Operation ist abgeschlossen und
//               das Promise-Objekt hat einen Wert
//    Rejected:  die asynchrone Operation ist fehlgeschlagen and das
//               Promise-Objekt wird nicht den Status "fulfilled" erreichen.
//               Im Promise-Objekt ist dann die Fehlerursache enthalten.

const logger = getLogger('buch-service');

/**
 * Ein Buch asynchron anhand seiner ID suchen und den Titel mitladen
 * @param id ID des gesuchten Buches
 * @returns Das gefundene Buch in einem Promise.
 * @throws NotFoundError falls kein Buch mit der ID existiert
 */
export const findById = async (id: number): Promise<Readonly<BuchDTO>> => {
    logger.debug('findById: id=%d', id);

    // Lesen: Keine Transaktion erforderlich
    const row = await selectById(id);
    if (row === undefined) {
        logger.debug('Es gibt kein Buch mit der ID %d', id);
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
    }

    const buchDTO: BuchDTO = new BuchDTO(row.buch, row.titel);

    logger.debug('findById: buchDTO=%o', buchDTO);
    return buchDTO;
};

/**
 * Ein Buch asynchron anhand seiner ID suchen und den Titel und die Abbildungen mitladen
 * @param id ID des gesuchten Buches
 * @returns Das gefundene Buch in einem Promise.
 * @throws NotFoundError falls kein Buch mit der ID existiert
 */
export const findByIdMitAbb = async (id: number): Promise<Readonly<BuchDTO>> => {
    logger.debug('findByIdMitAbb: id=%d', id);

    const rows = await selectByIdMitAbb(id);
    if (rows.length === 0) {
        logger.debug('Es gibt kein Buch mit der ID %d', id);
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
    }

    // jeder Datensatz enthaelt das gefundene Buch
    const [firstRow] = rows;
    if (firstRow === undefined) {
        logger.debug('Interner Fehler bei der Suche mit der ID %d', id);
        throw new NotFoundError(`Es gibt kein Buch mit der ID ${id}.`);
    }

    // Abbildungen als JSON-Array fuer das eine gefundene Buch
    const abbildungRows = rows.filter((row) => row !== undefined).map((row) => row.abbildung);

    const buchDTO: BuchDTO = new BuchDTO(firstRow.buch, firstRow.titel, abbildungRows);
    logger.debug('findByIdMitAbb: buchDTO=%o', buchDTO);
    return buchDTO;
};

export const createSlice = (
    buecher: BuchDTO[],
    totalElements: number,
): Readonly<Slice<BuchDTO>> => {
    const buchSlice: Slice<BuchDTO> = {
        content: buecher,
        totalElements,
    };
    logger.debug('createSlice: buchSlice=%o', buchSlice);
    return buchSlice;
};

export const findAll = async (pageable: Pageable): Promise<Readonly<Slice<BuchDTO>>> => {
    const { rows, totalElements } = await selectAll(pageable);
    if (totalElements === 0) {
        logger.debug('#findAll: Keine Buecher gefunden');
        throw new NotFoundError(`Ungueltige Seite "${pageable.number}"`);
    }
    const buecher = rows.map((row) => new BuchDTO(row.buch, row.titel));
    return createSlice(buecher, totalElements);
};

export const checkKeys = (keys: string[]) => {
    logger.debug('#checkKeys: keys=%o', keys);
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
            logger.debug('#checkKeys: ungueltiger Suchparameter "%s"', key);
            validKeys = false;
        }
    });

    return validKeys;
};

export const checkEnums = (suchparameter: Suchparameter) => {
    const { art } = suchparameter;
    logger.debug('#checkEnums: Suchparameter "art=%s"', art);
    return art === undefined || art === 'EPUB' || art === 'HARDCOVER' || art === 'PAPERBACK';
};

/**
 * Bücher asynchron suchen.
 * @param suchparameter JSON-Objekt mit Suchparameter.
 * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
 * @returns Ein JSON-Array mit den gefundenen Büchern.
 * @throws NotFoundError falls keine Bücher gefunden wurden.
 */
export const find = async (
    suchparameter: Record<string, string | undefined>,
    pageable: Pageable,
): Promise<Readonly<Slice<Readonly<BuchDTO>>>> => {
    logger.debug('find: suchparameter=%s, pageable=%o', JSON.stringify(suchparameter), pageable);

    // Keine Suchparameter?
    const keys = Object.keys(suchparameter);
    if (keys.length === 0) {
        return await findAll(pageable);
    }

    // Falsche Namen fuer Suchparameter?
    if (!checkKeys(keys) || !checkEnums(suchparameter)) {
        logger.debug('Ungueltige Suchparameter');
        throw new NotFoundError('Ungueltige Suchparameter');
    }

    // Das Resultat ist eine leere Liste, falls nichts gefunden
    // Lesen: Keine Transaktion erforderlich
    const result = await select(suchparameter, pageable);
    if (result === undefined) {
        throw new NotFoundError('Ungueltige Suchparameter');
    }

    const { rows, totalElements } = result;
    if (rows.length === 0) {
        logger.debug('find: Keine Buecher gefunden');
        throw new NotFoundError(
            `Keine Buecher gefunden: ${JSON.stringify(suchparameter)}, Seite ${pageable.number}}`,
        );
    }

    const buecher = rows.map((row) => new BuchDTO(row.buch, row.titel));
    return createSlice(buecher, totalElements ?? 0);
};
