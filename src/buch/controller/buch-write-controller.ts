/* eslint-disable max-lines */
// Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul besteht aus der Controller-Klasse für Schreiben an der REST-Schnittstelle.
 * @packageDocumentation
 */

import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiParam,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { type Request, type Response } from 'express';
import { AuthGuard, Public, Roles } from 'nest-keycloak-connect';
import { paths } from '../../config/paths.js';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.js';
import {
    BuchCreate,
    type BuchFileCreated,
    BuchUpdate,
    BuchWriteService,
} from '../service/buch-write-service.js';
import { BuchDTO, BuchDtoOhneRef } from './buch-dto.js';
import { createBaseUri } from './create-base-uri.js';
import { InvalidMimeTypeException } from './exceptions.js';

const MSG_FORBIDDEN = 'Kein Token mit ausreichender Berechtigung vorhanden';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'video/mp4',
    'video/webm',
    'video/quicktime',
]);
// https://github.com/expressjs/multer#multeropts
const MULTER_OPTIONS: MulterOptions = {
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_: any, file: any, cb: any) => {
        if (!MIME_TYPES.has(file.mimetype)) {
            return cb(new InvalidMimeTypeException(file.mimetype), false);
        }
        cb(null, true);
    },
};

/**
 * Die Controller-Klasse für die Verwaltung von Bücher.
 */
@Controller(paths.rest)
@UseGuards(AuthGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Buch REST-API')
@ApiBearerAuth()
export class BuchWriteController {
    readonly #service: BuchWriteService;

    readonly #logger = getLogger(BuchWriteController.name);

    constructor(service: BuchWriteService) {
        this.#service = service;
    }

    /**
     * Ein neues Buch wird asynchron angelegt. Das neu anzulegende Buch ist als
     * JSON-Datensatz im Request-Objekt enthalten. Wenn es keine
     * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
     * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
     * dass damit das neu angelegte Buch abgerufen werden kann.
     *
     * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
     * gesetzt und genauso auch wenn der Titel oder die ISBN-Nummer bereits
     * existieren.
     *
     * @param buchDTO JSON-Daten für ein Buch im Request-Body.
     * @param req Request-Objekt von Express für den Location-Header.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @Roles('admin', 'user')
    @ApiOperation({ summary: 'Ein neues Buch anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Buchdaten' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() buchDTO: BuchDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: buchDTO=%o', buchDTO);

        const buch = this.#buchDtoToBuchCreateInput(buchDTO);
        const id = await this.#service.create(buch);

        const location = `${createBaseUri(req)}/${id}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Zu einem gegebenen Buch wird eine Binärdatei, z.B. ein Bild, hochgeladen.
     * Nest realisiert File-Upload mit POST.
     * https://docs.nestjs.com/techniques/file-upload.
     * Postman: Body mit "form-data", key: "file" und "File" im Dropdown-Menü
     * @param id ID des vorhandenen Buches
     * @param file Binärdatei als `File`-Objekt von _Multer_.
     * @param req Request-Objekt von Express für den Location-Header.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Post(':id')
    @Public()
    // @Roles('admin')
    @UseInterceptors(FileInterceptor('file', MULTER_OPTIONS))
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Binärdatei mit einem Bild hochladen' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiCreatedResponse({ description: 'Erfolgreich hinzugefügt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Datei' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async addFile(
        @Param(
            'id',
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
        )
        id: number,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        // "Express.Multer.File.buffer" hat den Node-Typ "Buffer" und
        // ist abgeleitet von "Uint8Array<ArrayBufferLike>"
        const { buffer, originalname, size } = file;
        this.#logger.debug(
            'addFile: id: %d, originalname=%s, size=%d, options=%o',
            id,
            originalname,
            size,
            MULTER_OPTIONS,
        );

        const buchFile: BuchFileCreated | undefined =
            await this.#service.addFile(id, buffer, originalname, size);
        this.#logger.debug(
            'addFile: id=%s, byteLength=%s, filename=%s, mimetype=%s',
            buchFile?.id,
            buchFile?.data.byteLength,
            buchFile?.filename,
            buchFile?.mimetype,
        );

        const location = `${createBaseUri(req)}/file/${id}`;
        this.#logger.debug('addFile: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Ein vorhandenes Buch wird asynchron aktualisiert.
     *
     * Im Request-Objekt von Express muss die ID des zu aktualisierenden Buches
     * als Pfad-Parameter enthalten sein. Außerdem muss im Rumpf das zu
     * aktualisierende Buch als JSON-Datensatz enthalten sein. Damit die
     * Aktualisierung überhaupt durchgeführt werden kann, muss im Header
     * `If-Match` auf die korrekte Version für optimistische Synchronisation
     * gesetzt sein.
     *
     * Bei erfolgreicher Aktualisierung wird der Statuscode `204` (`No Content`)
     * gesetzt und im Header auch `ETag` mit der neuen Version mitgeliefert.
     *
     * Falls die Versionsnummer fehlt, wird der Statuscode `428` (`Precondition
     * required`) gesetzt; und falls sie nicht korrekt ist, der Statuscode `412`
     * (`Precondition failed`). Falls Constraints verletzt sind, wird der
     * Statuscode `400` (`Bad Request`) gesetzt und genauso auch wenn der neue
     * Titel oder die neue ISBN-Nummer bereits existieren.
     *
     * @param buchDTO Buchdaten im Body des Request-Objekts.
     * @param id Pfad-Paramater für die ID.
     * @param version Versionsnummer aus dem Header _If-Match_.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Put(':id')
    @Roles('admin', 'user')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Ein vorhandenes Buch aktualisieren' })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für optimistische Synchronisation',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Buchdaten' })
    @ApiPreconditionFailedResponse({
        description: 'Falsche Version im Header "If-Match"',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'Header "If-Match" fehlt',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async put(
        @Body() buchDTO: BuchDtoOhneRef,
        @Param(
            'id',
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
        )
        id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'put: id=%d, buchDTO=%o, version=%s',
            id,
            buchDTO,
            version,
        );

        if (version === undefined) {
            const problem = {
                statusCode: HttpStatus.PRECONDITION_REQUIRED,
                message: 'Header "If-Match" fehlt',
            };
            this.#logger.debug('put: problem=%o', problem);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'application/json')
                .send(problem);
        }

        const buch = this.#buchDtoToBuchUpdate(buchDTO);
        const neueVersion = await this.#service.update({ id, buch, version });
        this.#logger.debug('put: version=%d', neueVersion);
        return res.header('ETag', `"${neueVersion}"`).send();
    }

    /**
     * Ein Buch wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
     * ist. Der zurückgelieferte Statuscode ist `204` (`No Content`).
     *
     * @param id Pfad-Paramater für die ID.
     * @returns Leeres Promise-Objekt.
     */
    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Buch mit der ID löschen' })
    @ApiNoContentResponse({
        description: 'Das Buch wurde gelöscht oder war nicht vorhanden',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async delete(@Param('id') id: number) {
        this.#logger.debug('delete: id=%d', id);
        await this.#service.delete(id);
    }

    #buchDtoToBuchCreateInput(buchDTO: BuchDTO): BuchCreate {
        const abbildungen = buchDTO.abbildungen?.map((abbildungDTO) => {
            const abbildung = {
                beschriftung: abbildungDTO.beschriftung,
                contentType: abbildungDTO.contentType,
            };
            return abbildung;
        });
        const buch: BuchCreate = {
            version: 0,
            isbn: buchDTO.isbn,
            rating: buchDTO.rating,
            art: buchDTO.art ?? null,
            preis: buchDTO.preis.toNumber(),
            rabatt: buchDTO.rabatt?.toNumber() ?? 0,
            lieferbar: buchDTO.lieferbar ?? false,
            datum: buchDTO.datum ?? null,
            homepage: buchDTO.homepage ?? null,
            schlagwoerter: buchDTO.schlagwoerter ?? [],
            titel: {
                create: {
                    titel: buchDTO.titel.titel,
                    untertitel: buchDTO.titel.untertitel ?? null,
                },
            },
            abbildungen: { create: abbildungen ?? [] },
        };
        return buch;
    }

    #buchDtoToBuchUpdate(buchDTO: BuchDtoOhneRef): BuchUpdate {
        return {
            version: 0,
            isbn: buchDTO.isbn,
            rating: buchDTO.rating,
            art: buchDTO.art ?? null,
            preis: buchDTO.preis.toNumber(),
            rabatt: buchDTO.rabatt?.toNumber() ?? 0,
            lieferbar: buchDTO.lieferbar ?? false,
            datum: buchDTO.datum ?? null,
            homepage: buchDTO.homepage ?? null,
            schlagwoerter: buchDTO.schlagwoerter ?? [],
        };
    }
}
/* eslint-enable max-lines */
