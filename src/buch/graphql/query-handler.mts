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
    type BuchMitTitel,
    type BuchMitTitelUndAbbildungen,
} from '../service/buch-service.mts';
import { NotFoundError } from '../service/errors.mts';
import { createPageable } from '../service/pageable.mts';
import { type Slice } from '../service/slice.mts';
import {
    SuchParameterInput,
    toBuchType,
    toSuchparameter,
    type Buch,
    type ID,
} from './types.mts';

const logger = getLogger('query-handler', 'file');

export const buchHandler = async (id: ID) => {
    logger.debug('buchHandler: id=%s', id);

    let buch: Buch;
    try {
        const buchDB: BuchMitTitelUndAbbildungen =
            await container.buchService.findById({
                id: Number.parseInt(id, 10),
            });
        buch = toBuchType(buchDB);
    } catch (err) {
        if (err instanceof NotFoundError) {
            logger.debug('buchHandler: Kein Buch gefunden.');
            // GraphQLError wird von Yoga gefangen und in die Property "errors"
            // vom Response-Body transformiert.
            // https://the-guild.dev/graphql/yoga-server/tutorial/basic/09-error-handling
            throw new GraphQLError(err.message, {
                extensions: {
                    // https://the-guild.dev/graphql/yoga-server/docs/features/error-masking#error-codes-and-other-extensions
                    // https://www.apollographql.com/docs/apollo-server/data/errors
                    code: 'BAD_USER_INPUT',
                },
            });
        }

        const message = (err as Error).message;
        throw new GraphQLError(message, {
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
            },
        });
    }

    logger.debug('buchHandler: result=%o', buch);
    return buch;
};

export const buecherHandler = async (
    input?: SuchParameterInput | undefined,
) => {
    logger.debug('buecherHandler: input=%o', input ?? 'undefined');
    const pageable = createPageable({});
    const suchparameter = toSuchparameter(input);

    let buecherSlice: Readonly<Slice<Readonly<BuchMitTitel>>>;
    try {
        buecherSlice = await container.buchService.find(
            suchparameter,
            pageable,
        );
    } catch (err) {
        if (err instanceof NotFoundError) {
            logger.debug('Keine Buecher gefunden.');
            throw new GraphQLError(err.message, {
                extensions: {
                    code: 'BAD_USER_INPUT',
                },
            });
        }

        const message = (err as Error).message;
        throw new GraphQLError(message, {
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
            },
        });
    }
    logger.debug('buecherHandler: buecherSlice=%o', buecherSlice);

    const result = buecherSlice.content.map((buch) =>
        toBuchType(buch as BuchMitTitelUndAbbildungen),
    );
    logger.debug('buecherHandler: result=%o', result);
    return result;
};
