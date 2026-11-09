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

/**
 * Das Modul enthält Objekte mit Konfigurationsdaten aus "config.toml" durch _c12_.
 * _c12_ seit 2022, _cosmiconfig_ seit 2015.
 * @packageDocumentation
 */

// alternativ: Cosmiconfig erfordert "Custom Loader" fuer TOML

import { URL, fileURLToPath } from 'node:url';
import { hostname } from 'node:os';
import { loadConfig } from 'c12';
import process from 'node:process';
import { styleText } from 'node:util';
import { z } from 'zod';

// "import.meta" nur bei ESM
// - in package.json das Feld "type" mit dem Wert "module"
// - Dateiendung .mts
// https://nodejs.org/api/esm.html
// http://2ality.com/2017/11/import-meta.html
export const configURL = new URL(import.meta.url);
const tlsURL = new URL('tls/', configURL);

const hasTemporal = typeof Temporal !== 'undefined';
let hasQUIC: boolean;
try {
    // https://github.com/nodejs/node/blob/main/doc/api/quic.md
    // https://www.jasnell.me/posts/quic-part-4
    await import('node:quic');
    hasQUIC = true;
} catch {
    hasQUIC = false;
}

const runtime = process.versions?.bun ? 'Bun' : 'Node';
const lenKeycloakSecret = 86;

// https://getpino.io
const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
type LogLevel = (typeof logLevels)[number];
const logLevelEnv = process.env['LOG_LEVEL'];
let logLevelDefault: LogLevel;
if (logLevels.includes(logLevelEnv as LogLevel)) {
    logLevelDefault = logLevelEnv as LogLevel;
} else {
    logLevelDefault = 'info';
}

// Zod-Schema fuer config.toml
const ConfigSchema = z.object({
    server: z.object({
        host: z.string().default(hostname()),
        // oxlint-disable-next-line no-magic-numbers
        port: z.number().int().min(1).max(65535).default(3000),
        keyFile: z.url().default(fileURLToPath(new URL('key.pem', tlsURL))),
        certFile: z.url().default(fileURLToPath(new URL('certificate.crt', tlsURL))),
        allowHTTP1: z.boolean().default(false),
        hasTemporal: z.boolean().default(hasTemporal),
        hasQUIC: z.boolean().default(hasQUIC),
        nodeEnv: z
            .literal(['production', 'PRODUCTION', 'test', 'development'])
            .prefault(() => (process.env['NODE_ENV'] as any) ?? 'production'),
        runtime: z.literal(['Node', 'Bun']).default(runtime),
    }),

    db: z.object({
        user: z.string().default('buch'),
        database: z.string().default('buch'),
        password: z
            .string()
            .prefault(() => process.env['DB_PASSWORD'] ?? 'FEHLER: DB_PASSWORD in .env setzen'),
        adminPassword: z
            .string()
            .prefault(
                () =>
                    process.env['DB_ADMIN_PASSWORD'] ?? 'FEHLER: DB_ADMIN_PASSWORD in .env setzen',
            ),
        host: z.string().default('postgres'),
        cert: z.string().endsWith('.crt').default('config/postgresql/server.crt'),
        tlsMinVersion: z.literal(['TLSv1.3', 'TLSv1.2']).default('TLSv1.3'),
        tlsMaxVersion: z.literal(['TLSv1.3', 'TLSv1.2']).default('TLSv1.3'),
        poolMax: z.number().int().min(1).max(100).default(10), // oxlint-disable-line no-magic-numbers
        poolIdleTimeoutMillis: z.number().int().min(1_000).max(60_000).default(10_000), // oxlint-disable-line no-magic-numbers
        poolConnectionTimeoutMillis: z.number().int().min(1_000).default(3_000), // oxlint-disable-line no-magic-numbers
        populate: z.boolean().default(false),
        admin: z.string().default('postgres'),
    }),

    keycloak: z.object({
        https: z.boolean().default(true),
        host: z.string().default('keycloak'),
        // oxlint-disable-next-line no-magic-numbers
        port: z.number().int().min(1).max(65535).default(8443),
        realm: z.string().default('javascript'),
        clientId: z.string().default('javascript-client'),
        clientSecret: z
            .string()
            .min(lenKeycloakSecret)
            .max(lenKeycloakSecret)
            .prefault(
                () =>
                    process.env['CLIENT_SECRET']?.replace(/^CLIENT_SECRET=/u, '') ??
                    'FEHLER: CLIENT_SECRET in .env setzen',
            ),
        audience: z.array(z.string()).default(['account']),
    }),

    mail: z.object({
        enabled: z.boolean().default(true),
        host: z.string().default('mail'),
        // oxlint-disable-next-line no-magic-numbers
        port: z.number().int().min(1).max(65535).default(25),
        logger: z.boolean().default(false),
        from: z.string().default('"Joe Doe" <Joe.Doe@acme.com>'),
        to: z.string().default('"Foo Bar" <Foo.Bar@acme.com>'),
    }),

    log: z.object({
        dir: z.string().default('/tmp'),
        file: z.string().default('server.log'),
        level: z
            .literal(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
            .default(logLevelDefault),
        pretty: z.boolean().default(false),
    }),
});

export type Config = z.infer<typeof ConfigSchema>;

const tomlName = 'config.toml';
const tomlURL = new URL(tomlName, configURL);
const message = styleText(['black', 'bgWhite'], `${tomlName}:`);
console.log(`${message} ${tomlURL}`);

// Konfigurationsdaten aus "config.toml" durch "c12"
export const getConfig = async (): Promise<Config> => {
    const { config } = await loadConfig<Config>({
        name: 'config',
        configFile: fileURLToPath(tomlURL),
        configFileRequired: true,
        dotenv: true,
        schema: ConfigSchema,
    });

    return config;
};
