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

// https://medium.com/@tiffanyadisuryo/setting-up-a-prometheus-and-grafana-monitoring-system-for-my-bun-js-backend-243c4c3cd29d

import { type Context, type Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import { Counter, Histogram, collectDefaultMetrics } from 'prom-client';

// Metriken für Prometheus mit Default-Daten konfigurieren
collectDefaultMetrics();

// Metrik: gesamte Anzahl an HTTP-Requests
const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Gesamte Anzahl an HTTP-Requests',
    labelNames: ['method', 'path', 'status_code'],
});

// Metrik: Histogramm mit Dauer von HTTP-Requests
const httpRequestDurationSeconds = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Dauer von HTTP-Requests in Sekunden',
    labelNames: ['method', 'path', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

/**
 * Middleware für Hono, um bei einem eingegangenen Request Metriken für
 * Prometheus zu erzeugen.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
// https://hono.dev/docs/guides/middleware
export const trackMetrics = createMiddleware(async (c: Context, next: Next) => {
    const start = Date.now();
    const { path, method } = c.req;

    await next();

    const { res } = c;
    const { status } = res;
    const duration = (Date.now() - start) / 1000;

    httpRequestsTotal.inc({ method, path, status_code: status });
    httpRequestDurationSeconds.observe(
        { method, path, status_code: status },
        duration,
    );
});
