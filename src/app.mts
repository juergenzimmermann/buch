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

import { type Context, Hono, type Next } from 'hono';
import { ForbiddenError, UnauthorizedError } from './security/errors.mts';
import {
    IsbnExistsError,
    NotFoundError,
    VersionInvalidError,
    VersionOutdatedError,
} from './buch/service/errors.mts';
import {
    createProblemDetails,
    forbidden,
    preconditionFailed,
    unauthorized,
    unprocessableContent,
} from './problem-details.mts';
import { type ZodError } from 'zod';
import { router as authRouter } from './security/auth-router.mts';
import { router as buchWriteRouter } from './buch/router/buch-write-router.mts';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { corsOptions } from './config/cors.mts';
import { createMiddleware } from 'hono/factory'; // oxlint-disable-line import/max-dependencies
import { router as devRouter } from './config/dev/dev-router.mts';
import { env } from './config/env.mts';
import { getLogger } from './logger/logger.mts';
import { graphqlApp } from './buch/graphql/graphql-app.mts';
import { router as healthRouter } from './admin/health-router.mts';
import { paths } from './config/paths.mts';
import { router as prometheusRouter } from './monitoring/prometheus-router.mts';
import { requestLogger } from './logger/request-logger.mts';
import { responseTime } from './logger/response-time.mts';
import { router } from './buch/router/buch-router.mts';
import { secureHeaders } from 'hono/secure-headers';
import { showRoutes } from 'hono/dev';
import { trackMetrics } from './monitoring/prometheus-metrics.mts';

/**
 * Web-Applikation mit Hono.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const app = new Hono();

const logger = getLogger('app');

// -----------------------------------------------------------------------------
// M i d d l e w a r e
// -----------------------------------------------------------------------------

// Globale Middleware muss vor den Routen registriert werden
// https://hono.dev/docs/guides/middleware#execution-order

// Zusaetzliche Security-Header
const securityHeaders = createMiddleware(async (c: Context, next: Next) => {
    c.header('X-Content-Type-Options', 'nosniff');
    // siehe CORS
    c.header('X-Frame-Options', 'SAMEORIGIN');
    return await next();
});

// https://hono.dev/docs/middleware/builtin/secure-headers
// https://hono.dev/docs/middleware/builtin/cors
// https://hono.dev/docs/middleware/builtin/compress
app.use(secureHeaders(), cors(corsOptions), securityHeaders, compress());

app.use(trackMetrics);

if (logger.isLevelEnabled('debug')) {
    app.use(responseTime, requestLogger);
}

// -----------------------------------------------------------------------------
// R o u t e n
// -----------------------------------------------------------------------------
app.route(paths.rest, router);
app.route(paths.rest, buchWriteRouter);
app.route(paths.health, healthRouter);
app.route(paths.auth, authRouter);
// Yoga baut eine Hono-App mit Basispfad "/graphql"
app.route('/', graphqlApp);
app.route('/prometheus', prometheusRouter);

const { NODE_ENV } = env;
if (NODE_ENV === 'development' || NODE_ENV === 'test') {
    app.route(paths.dev, devRouter);
}

if (logger.isLevelEnabled('debug')) {
    showRoutes(app, {
        verbose: true,
    });
}

// -----------------------------------------------------------------------------
// E r r o r   H a n d l e r
// -----------------------------------------------------------------------------
// https://hono.dev/docs/api/exception#handling-httpexceptions
// oxlint-disable-next-line promise/prefer-await-to-callbacks
app.onError((error, c) => {
    if (error instanceof NotFoundError) {
        // https://hono.dev/docs/api/context#notfound
        return c.notFound();
    }

    if (error.name === 'ZodError') {
        return createProblemDetails(
            c,
            unprocessableContent,
            (error as ZodError).issues,
        );
    }

    if (error instanceof IsbnExistsError) {
        return createProblemDetails(c, unprocessableContent, error.message);
    }

    if (
        error instanceof VersionInvalidError ||
        error instanceof VersionOutdatedError
    ) {
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
