/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
// eslint-disable-next-line max-classes-per-file
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { BuchDTO, BuchOhneSchlagwoerterDTO } from '../rest/buchDTO.entity.js';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { IsInt, IsUUID, Min } from 'class-validator';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { type Buch } from '../entity/buch.entity.js';
import { BuchWriteService } from '../service/buch-write.service.js';
import { type IdInput } from './buch-query.resolver.js';
import { JwtAuthGraphQlGuard } from '../../security/auth/jwt/jwt-auth-graphql.guard.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { Roles } from '../../security/auth/roles/roles.decorator.js';
import { RolesGraphQlGuard } from '../../security/auth/roles/roles-graphql.guard.js';
import { type Schlagwort } from '../entity/schlagwort.entity.js';
import { UserInputError } from 'apollo-server-express';
import { getLogger } from '../../logger/logger.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

class BuchUpdateDTO extends BuchOhneSchlagwoerterDTO {
    @IsUUID()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class BuchMutationResolver {
    readonly #service: BuchWriteService;

    readonly #logger = getLogger(BuchMutationResolver.name);

    constructor(service: BuchWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async create(@Args('input') buchDTO: BuchDTO) {
        this.#logger.debug('create: buchDTO=%o', buchDTO);

        const result = await this.#service.create(this.#dtoToBuch(buchDTO));
        this.#logger.debug('createBuch: result=%o', result);

        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError(
                this.#errorMsgCreateBuch(result as CreateError),
            );
        }
        return result;
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async update(@Args('input') buch: BuchUpdateDTO) {
        this.#logger.debug('update: buch=%o', buch);
        const versionStr = `"${buch.version.toString()}"`;

        const result = await this.#service.update(
            buch.id,
            buch as Buch,
            versionStr,
        );
        if (typeof result === 'object') {
            throw new UserInputError(this.#errorMsgUpdateBuch(result));
        }
        this.#logger.debug('updateBuch: result=%d', result);
        return result;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const result = await this.#service.delete(idStr);
        this.#logger.debug('deleteBuch: result=%s', result);
        return result;
    }

    #dtoToBuch(buchDTO: BuchDTO): Buch {
        const buch: Buch = {
            id: undefined,
            version: undefined,
            titel: buchDTO.titel,
            rating: buchDTO.rating,
            art: buchDTO.art,
            verlag: buchDTO.verlag,
            preis: buchDTO.preis,
            rabatt: buchDTO.rabatt,
            lieferbar: buchDTO.lieferbar,
            datum: buchDTO.datum,
            isbn: buchDTO.isbn,
            homepage: buchDTO.homepage,
            schlagwoerter: [],
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        buchDTO.schlagwoerter?.forEach((s) => {
            const schlagwort: Schlagwort = {
                id: undefined,
                schlagwort: s,
                buch,
            };
            buch.schlagwoerter.push(schlagwort);
        });

        return buch;
    }

    #errorMsgCreateBuch(err: CreateError) {
        switch (err.type) {
            case 'TitelExists': {
                return `Der Titel "${err.titel}" existiert bereits`;
            }
            case 'IsbnExists': {
                return `Die ISBN ${err.isbn} existiert bereits`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }

    #errorMsgUpdateBuch(err: UpdateError) {
        switch (err.type) {
            case 'TitelExists': {
                return `Der Titel "${err.titel}" existiert bereits`;
            }
            case 'BuchNotExists': {
                return `Es gibt kein Buch mit der ID ${err.id}`;
            }
            case 'VersionInvalid': {
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            }
            case 'VersionOutdated': {
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }
}
