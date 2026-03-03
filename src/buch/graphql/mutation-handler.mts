// Copyright (C) 2026 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { GraphQLError } from 'graphql';
import { container } from '../../container.mts';
import { getLogger } from '../../logger/logger.mts';
import {
    BuchNeuSchema,
    BuchUpdateGraphQLSchema,
} from '../router/buch-validation.mts';
import { NotFoundError } from '../service/errors.mts';
import {
    type BuchNeuInput,
    type BuchUpdateInput,
    type CreatePayload,
    type DeletePayload,
    type ID,
    type UpdatePayload,
    toCreate,
    toID,
    toInt,
    toNumber,
    toUpdate,
} from './types.mts';

const logger = getLogger('mutation-handler', 'file');
const { buchWriteService, keycloakService } = container;

// -----------------------------------------------------------------------------
// N e u a n l e g e n
// -----------------------------------------------------------------------------

// Validierung mit Zod
const validateBuchNeu = (buch: BuchNeuInput) => {
    try {
        BuchNeuSchema.parse(buch);
    } catch (err) {
        if (err instanceof Error) {
            const { message } = err;
            if (err.name === 'ZodError') {
                throw new GraphQLError(message, {
                    extensions: {
                        // https://the-guild.dev/graphql/yoga-server/docs/features/error-masking#error-codes-and-other-extensions
                        // https://www.apollographql.com/docs/apollo-server/data/errors
                        code: 'BAD_USER_INPUT',
                    },
                });
            } else {
                throw new GraphQLError(message, {
                    extensions: {
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        } else {
            throw new GraphQLError('Unbekannter Fehler', {
                extensions: {
                    code: 'INTERNAL_SERVER_ERROR',
                },
            });
        }
    }

    logger.debug('validateBuchNeu: ok');
};

export const createHandler = async (
    input: BuchNeuInput,
): Promise<CreatePayload> => {
    logger.debug('createHandler: input=%o', input);

    // Validierung mit Zod
    validateBuchNeu(input);

    const buchCreate = toCreate(input);
    logger.debug('createHandler: buchCreate=%o', buchCreate);
    const id = await buchWriteService.create(buchCreate);

    logger.debug('createHandler: id=%d', id);
    return { id: toID(id) };
};

// -----------------------------------------------------------------------------
// A e n d e r n
// -----------------------------------------------------------------------------

// Validierung mit Zod
const validateBuchUpdate = (buch: BuchUpdateInput) => {
    try {
        BuchUpdateGraphQLSchema.parse(buch);
    } catch (err) {
        if (err instanceof Error) {
            const { message } = err;
            if (err.name === 'ZodError') {
                throw new GraphQLError(message, {
                    extensions: {
                        // https://the-guild.dev/graphql/yoga-server/docs/features/error-masking#error-codes-and-other-extensions
                        // https://www.apollographql.com/docs/apollo-server/data/errors
                        code: 'BAD_USER_INPUT',
                    },
                });
            } else {
                throw new GraphQLError(message, {
                    extensions: {
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        } else {
            throw new GraphQLError('Unbekannter Fehler', {
                extensions: {
                    code: 'INTERNAL_SERVER_ERROR',
                },
            });
        }
    }

    logger.debug('validateBuchUpdate: ok');
};

export const updateHandler = async (
    input: BuchUpdateInput,
): Promise<UpdatePayload> => {
    logger.debug('updateHandler: input=%o', input);

    // Validierung mit Zod
    validateBuchUpdate(input);

    const buchUpdate = toUpdate(input);
    logger.debug('updateHandler: buchUpdate=%o', buchUpdate);

    let version: number | undefined;
    try {
        version = await buchWriteService.update({
            id: toNumber(input.id),
            buch: buchUpdate,
            version: `"${input.version}"`,
        });
    } catch (err) {
        if (err instanceof NotFoundError) {
            logger.debug('buchHandler: Kein Buch gefunden.');
            throw new GraphQLError(err.message, {
                extensions: {
                    code: 'BAD_USER_INPUT',
                },
            });
        }
    }

    logger.debug('updateHandler: version=%s', version);
    return { version: toInt(version ?? 0) };
};

// -----------------------------------------------------------------------------
// L o e s c h e n
// -----------------------------------------------------------------------------
export const deleteHandler = async (id: ID) => {
    logger.debug('deleteHandler: id=%s', id);
    const success = await buchWriteService.delete(toNumber(id));
    const payload: DeletePayload = { success };
    return payload;
};

// -----------------------------------------------------------------------------
// S e c u r i t y
// -----------------------------------------------------------------------------
export const tokenHandler = async ({
    username,
    password,
}: {
    username: string;
    password: string;
}) => {
    logger.debug('tokenHandler: username=%s', username);
    const token = await keycloakService.token({ username, password });
    if (token === undefined) {
        throw new GraphQLError('Fehler bei username und/oder Passwort', {
            extensions: {
                code: 'BAD_USER_INPUT',
            },
        });
    }
    logger.debug('tokenHandler: token=%o', token);
    return token;
};
