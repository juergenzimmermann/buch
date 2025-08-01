// Copyright (C) 2024 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul enthält die Konfiguration für _Keycloak_.
 * @packageDocumentation
 */

import {
    type KeycloakConnectConfig,
    PolicyEnforcementMode,
    TokenValidation,
} from 'nest-keycloak-connect';
import { Agent } from 'node:https';
import { config } from './app.js';
import { env } from './env.js';
import { httpsOptions } from './https.js';

const { keycloak } = config;

if (keycloak !== undefined && keycloak !== null) {
    if (
        keycloak.schema !== undefined &&
        typeof keycloak.schema !== 'string' &&
        keycloak.port !== undefined &&
        typeof keycloak.port !== 'number'
    ) {
        throw new TypeError(
            'Die Konfiguration für Keycloak (Schema und Port) ist falsch',
        );
    }
    if (keycloak.realm !== undefined && typeof keycloak.realm !== 'string') {
        throw new TypeError(
            'Der konfigurierte Realm-Name für Keycloak ist kein String',
        );
    }
    if (
        keycloak.clientId !== undefined &&
        typeof keycloak.clientId !== 'string'
    ) {
        throw new TypeError(
            'Der konfigurierte Client-ID für Keycloak ist kein String',
        );
    }
    if (
        keycloak.tokenValidation !== undefined &&
        Object.values(TokenValidation).includes(keycloak.tokenValidation) // eslint-disable-line @typescript-eslint/no-unsafe-argument
    ) {
        throw new TypeError(
            'Der konfigurierte Wert für TokenValidation bei Keycloak ist ungültig',
        );
    }
}

const schema = (keycloak?.schema as string | undefined) ?? 'https';
const host = (keycloak?.host as string | undefined) ?? 'keycloak';
const port = (keycloak?.port as number | undefined) ?? 8443;
const authServerUrl = `${schema}://${host}:${port}`;
// Keycloak ist in Sicherheits-Bereich (= realms) unterteilt
const realm = (keycloak?.realm as string | undefined) ?? 'nest';
const clientId = (keycloak?.clientId as string | undefined) ?? 'nest-client';
const tokenValidation =
    (keycloak?.tokenValidation as TokenValidation | undefined) ??
    (TokenValidation.ONLINE as TokenValidation);

const { CLIENT_SECRET, NODE_ENV } = env;

// https://github.com/ferrerojosh/nest-keycloak-connect/blob/master/README.md#nest-keycloak-options
export const keycloakConnectOptions: KeycloakConnectConfig = {
    authServerUrl,
    realm,
    clientId,
    secret:
        CLIENT_SECRET ??
        'ERROR: Umgebungsvariable CLIENT_SECRET nicht gesetzt!',
    policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
    tokenValidation,
};
if (NODE_ENV === 'development') {
    console.debug('keycloakConnectOptions = %o', keycloakConnectOptions);
} else {
    const { secret, ...keycloakConnectOptionsLog } = keycloakConnectOptions;
    console.debug('keycloakConnectOptions = %o', keycloakConnectOptionsLog);
}

/** Pfade für den REST-Client zu Keycloak */
export const paths = {
    accessToken: `realms/${realm}/protocol/openid-connect/token`,
    userInfo: `realms/${realm}/protocol/openid-connect/userinfo`,
    introspect: `realms/${realm}/protocol/openid-connect/token/introspect`,
};

/** Agent für Axios für Requests bei selbstsigniertem Zertifikat */
export const httpsAgent = new Agent({
    requestCert: true,
    // selbst-signiertes Zertifikat
    rejectUnauthorized: false,
    ca: httpsOptions.cert as Buffer,
});
