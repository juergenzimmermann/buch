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

// eslint-disable-next-line max-classes-per-file
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.js';
import { BuchDTO } from '../controller/buch-dto.js';
import {
    BuchWriteService,
    BuchCreate,
    BuchUpdate,
} from '../service/buch-write-service.js';
import { type IdInput } from './query.js';
import { HttpExceptionFilter } from './http-exception-filter.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

export type CreatePayload = {
    readonly id: number;
};

export type UpdatePayload = {
    readonly version: number;
};

export type DeletePayload = {
    readonly success: boolean;
};

export class BuchUpdateDTO extends BuchDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver('Buch')
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class BuchMutationResolver {
    readonly #service: BuchWriteService;

    readonly #logger = getLogger(BuchMutationResolver.name);

    constructor(service: BuchWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'user')
    async create(@Args('input') buchDTO: BuchDTO) {
        this.#logger.debug('create: buchDTO=%o', buchDTO);

        const buch = this.#buchDtoToBuchCreate(buchDTO);
        const id = await this.#service.create(buch);
        this.#logger.debug('createBuch: id=%d', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    @Mutation()
    @Roles('admin', 'user')
    async update(@Args('input') buchDTO: BuchUpdateDTO) {
        this.#logger.debug('update: buch=%o', buchDTO);

        const buch = this.#buchUpdateDtoToBuchUpdate(buchDTO);
        const versionStr = `"${buchDTO.version.toString()}"`;

        const versionResult = await this.#service.update({
            id: Number.parseInt(buchDTO.id, 10),
            buch,
            version: versionStr,
        });
        // TODO BadUserInputError
        this.#logger.debug('updateBuch: versionResult=%d', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() id: IdInput) {
        const idValue = id.id;
        this.#logger.debug('delete: idValue=%s', idValue);
        await this.#service.delete(Number(idValue));
        const payload: DeletePayload = { success: true };
        return payload;
    }

    #buchDtoToBuchCreate(buchDTO: BuchDTO): BuchCreate {
        // "Optional Chaining" ab ES2020
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

    #buchUpdateDtoToBuchUpdate(buchDTO: BuchUpdateDTO): BuchUpdate {
        return {
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

    // #errorMsgCreateBuch(err: CreateError) {
    //     switch (err.type) {
    //         case 'IsbnExists': {
    //             return `Die ISBN ${err.isbn} existiert bereits`;
    //         }
    //         default: {
    //             return 'Unbekannter Fehler';
    //         }
    //     }
    // }

    // #errorMsgUpdateBuch(err: UpdateError) {
    //     switch (err.type) {
    //         case 'BuchNotExists': {
    //             return `Es gibt kein Buch mit der ID ${err.id}`;
    //         }
    //         case 'VersionInvalid': {
    //             return `"${err.version}" ist keine gueltige Versionsnummer`;
    //         }
    //         case 'VersionOutdated': {
    //             return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
    //         }
    //         default: {
    //             return 'Unbekannter Fehler';
    //         }
    //     }
    // }
}
