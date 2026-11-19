// oxlint-disable import/max-dependencies
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
import { router as authRouter } from './security/auth-router.mts';
import { router as buchFileRouter } from './buch/router/buch-file-router.mts';
import { router as buchWriteRouter } from './buch/router/buch-write-router.mts';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { corsOptions } from './config/cors-options.mts';
import { createErrorHandler } from './error-handler.mts';
import { defineMiddleware } from 'hono/factory';
import { router as devRouter } from './config/dev/dev-router.mts';
import { getConfig } from './config/config.mts';
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
 * Web-Applikation mit Hono. https://e18e.dev/docs/replacements/express#hono
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
const securityHeaders = defineMiddleware(async (c: Context, next: Next) => {
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
app.route(paths.rest, buchFileRouter);
app.route(paths.health, healthRouter);
app.route(paths.auth, authRouter);
// Yoga baut eine Hono-App mit Basispfad "/graphql"
app.route('/', graphqlApp);
app.route('/prometheus', prometheusRouter);

// "Top-level await"
const config = await getConfig();
// Destructuring
const { nodeEnv } = config.server;
if (nodeEnv === 'development' || nodeEnv === 'test') {
    app.route(paths.dev, devRouter);
}

if (logger.isLevelEnabled('debug')) {
    showRoutes(app, {
        verbose: true,
    });
}

createErrorHandler(app);
