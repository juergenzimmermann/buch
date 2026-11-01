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
 * Das Modul enthält Objekte mit Konfigurationsdaten aus der TOML-Datei.
 * @packageDocumentation
 */

// alternativ: Cosmiconfig erfordert "Custom Loader" fuer TOML

import { URL, fileURLToPath } from 'node:url';
import { hostname } from 'node:os';
import { loadConfig } from 'c12';
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

// const { NODE_ENV } = env;

const runtime = process.versions?.bun ? 'Bun' : 'Node';

const ConfigSchema = z.object({
    server: z.object({
        host: z.string().default(hostname()),
        // oxlint-disable-next-line no-magic-numbers
        port: z.number().int().min(1).max(65535).default(3000),
        key: z.url().default(new URL('key.pem', tlsURL).toString()),
        cert: z.url().default(new URL('certificate.crt', tlsURL).toString()),
        allowHTTP1: z.boolean().default(false),
        hasTemporal: z.boolean().default(hasTemporal),
        hasQUIC: z.boolean().default(hasQUIC),
        nodeEnv: z
            .literal(['production', 'PRODUCTION', 'test', 'development'])
            .default('production'),
        runtime: z.literal(['Node', 'Bun']).default(runtime),
    }),

    db: z.object({
        // !!!url: z.url(),
        populate: z.boolean().default(false),
    }),

    keycloak: z.object({
        https: z.boolean().default(true),
        host: z.string().default('keycloak'),
        // oxlint-disable-next-line no-magic-numbers
        port: z.number().int().min(1).max(65535).default(8443),
        realm: z.string().default('javascript'),
        clientId: z.string().default('javascript-client'),
        clientSecret: z.string(),
        audience: z.array(z.string()).default(['account']),
    }),

    mail: z.object({
        enabled: z.boolean().default(true),
        host: z.string().default('mail'),
        // oxlint-disable-next-line no-magic-numbers
        port: z.number().int().min(1).max(65535).default(25),
        log: z.boolean().default(false),
        from: z.string().default('"Joe Doe" <Joe.Doe@acme.com>'),
        to: z.string().default('"Foo Bar" <Foo.Bar@acme.com>'),
    }),

    log: z.object({
        dir: z.string().default('/tmp'),
        level: z.literal(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
        pretty: z.boolean().default(false),
    }),
});

export type Config = z.infer<typeof ConfigSchema>;

const tomlName = 'config.toml';
const tomlURL = new URL(tomlName, configURL);
const message = styleText(['black', 'bgWhite'], `${tomlName}:`);
console.log(`${message} ${tomlURL}`);
export const getConfig = async (): Promise<Config> => {
    const { config } = await loadConfig<Config>({
        name: 'config',
        configFile: fileURLToPath(tomlURL),
        configFileRequired: true,
        schema: ConfigSchema,
    });

    return config;
};
