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

import { ForbiddenError, UnauthorizedError } from './security/errors.mts';
import {
    IsbnExistsError,
    NotFoundError,
    VersionInvalidError,
    VersionOutdatedError,
} from './buch/service/errors.mts';
import {
    badRequest,
    createProblemDetails,
    forbidden,
    preconditionFailed,
    unauthorized,
    unprocessableContent,
} from './problem-details.mts';
import { BadRequestError } from './buch/router/errors.mts';
import { Hono } from 'hono';
import { type ZodError } from 'zod';
import { getLogger } from './logger/logger.mts';

const logger = getLogger('error-handler');

// -----------------------------------------------------------------------------
// E r r o r   H a n d l e r
// -----------------------------------------------------------------------------
// https://hono.dev/docs/api/exception#handling-httpexceptions
export const createErrorHandler = (app: Hono) =>
    // oxlint-disable-next-line promise/prefer-await-to-callbacks
    app.onError((error, c) => {
        if (error instanceof NotFoundError) {
            // https://hono.dev/docs/api/context#notfound
            return c.notFound();
        }

        if (error instanceof BadRequestError) {
            return createProblemDetails(c, badRequest);
        }

        if (error.name === 'ZodError') {
            const zodError = error as ZodError;
            const { issues } = zodError;
            logger.debug('ZodError issues=%o', issues);
            return createProblemDetails(c, unprocessableContent, issues);
        }

        if (error instanceof IsbnExistsError) {
            return createProblemDetails(c, unprocessableContent, error.message);
        }

        if (error instanceof VersionInvalidError || error instanceof VersionOutdatedError) {
            return createProblemDetails(c, preconditionFailed, error.message);
        }

        if (error instanceof UnauthorizedError) {
            return createProblemDetails(c, unauthorized, error.message);
        }

        if (error instanceof ForbiddenError) {
            return createProblemDetails(c, forbidden, error.message);
        }

        logger.error('Interner Fehler: %o', error);
        console.log(error.stack);
        return c.body('Interner Fehler', 500);
    });
