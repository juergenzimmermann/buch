/* eslint-disable camelcase, @typescript-eslint/naming-convention */
/*
 * Copyright (C) 2024 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import {
    type KeycloakConnectOptions,
    type KeycloakConnectOptionsFactory,
} from 'nest-keycloak-connect';
import axios, {
    type AxiosInstance,
    type AxiosResponse,
    type RawAxiosRequestHeaders,
} from 'axios';
import { keycloakConnectOptions, paths } from '../../config/keycloak.js';
import { Injectable } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';

@Injectable()
export class KeycloakService implements KeycloakConnectOptionsFactory {
    readonly #loginHeaders: RawAxiosRequestHeaders;

    readonly #keycloakClient: AxiosInstance;

    readonly #logger = getLogger(KeycloakService.name);

    constructor() {
        const { authServerUrl, clientId, secret } = keycloakConnectOptions;

        // https://www.keycloak.org/docs-api/23.0.4/rest-api/index.html
        const authorization = Buffer.from(
            `${clientId}:${secret}`,
            'utf8',
        ).toString('base64');
        this.#loginHeaders = {
            Authorization: `Basic ${authorization}`, // eslint-disable-line @stylistic/quote-props
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        this.#keycloakClient = axios.create({
            baseURL: authServerUrl!,
            // ggf. httpsAgent fuer HTTPS bei selbst-signiertem Zertifikat
        });
        this.#logger.debug('keycloakClient=%o', this.#keycloakClient.defaults);
    }

    createKeycloakConnectOptions(): KeycloakConnectOptions {
        return keycloakConnectOptions;
    }

    async login(username: string | undefined, password: string | undefined) {
        this.#logger.debug('login: username=%s', username);
        if (username === undefined || password === undefined) {
            return;
        }

        // https://stackoverflow.com/questions/62683482/keycloak-rest-api-call-to-get-access-token-of-a-user-through-admin-username-and
        // https://stackoverflow.com/questions/65714161/keycloak-generate-access-token-for-a-user-with-keycloak-admin
        const loginBody = `grant_type=password&username=${username}&password=${password}`;
        let response: AxiosResponse<Record<string, number | string>>;
        try {
            response = await this.#keycloakClient.post(
                paths.accessToken,
                loginBody,
                { headers: this.#loginHeaders },
            );
        } catch {
            this.#logger.warn('login: Fehler bei %s', paths.accessToken);
            return;
        }

        this.#logRoles(response);
        this.#logger.debug('login: response.data=%o', response.data);
        return response.data;
    }

    async refresh(refresh_token: string | undefined) {
        this.#logger.debug('refresh: refresh_token=%s', refresh_token);
        if (refresh_token === undefined) {
            return;
        }

        // https://stackoverflow.com/questions/51386337/refresh-access-token-via-refresh-token-in-keycloak
        const refreshBody = `grant_type=refresh_token&refresh_token=${refresh_token}`;
        let response: AxiosResponse<Record<string, number | string>>;
        try {
            response = await this.#keycloakClient.post(
                paths.accessToken,
                refreshBody,
                { headers: this.#loginHeaders },
            );
        } catch {
            this.#logger.warn(
                'refresh: Fehler bei POST-Request: path=%s, body=%o',
                paths.accessToken,
                refreshBody,
            );
            return;
        }
        this.#logger.debug('refresh: response.data=%o', response.data);
        return response.data;
    }

    // Extraktion der Rollen: wird auf Client-Seite benoetigt
    // { ..., "resource_access": { "buch-client": { "roles": ["admin"] } ...}
    // https://www.keycloak.org/docs-api/23.0.4/rest-api/index.html#ClientInitialAccessCreatePresentation
    #logRoles(response: AxiosResponse<Record<string, string | number>>) {
        const { access_token } = response.data;
        // Payload ist der mittlere Teil zwischen 2 Punkten und mit Base64 codiert
        const [, payloadStr] = (access_token as string).split('.');
        // Base64 decodieren
        const payloadDecoded = atob(payloadStr!);
        // JSON-Objekt aus dem decodierten String herstellen
        const payload = JSON.parse(payloadDecoded); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        const { roles } = payload.resource_access['buch-client']; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        this.#logger.debug('#logRoles: roles=%o', roles);
    }
}
/* eslint-enable camelcase, @typescript-eslint/naming-convention */
