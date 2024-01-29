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

export interface LoginResult {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    refresh_expires_in: number;
    roles?: string[] | undefined;
}

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

        // https://www.keycloak.org/docs-api/23.0.4/rest-api/index.html#ClientInitialAccessCreatePresentation
        const { access_token, expires_in, refresh_expires_in, refresh_token } =
            response.data;

        const roles = await this.#getRoles(access_token as string);

        const result: LoginResult = {
            access_token: access_token as string,
            expires_in: expires_in as number,
            refresh_token: refresh_token as string,
            refresh_expires_in: refresh_expires_in as number,
            roles,
        };
        this.#logger.debug('login: result=%o', result);
        return result;
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
        this.#logger.debug('refresh: response=%o', response);

        // https://www.keycloak.org/docs-api/23.0.4/rest-api/index.html#ClientInitialAccessCreatePresentation
        const { access_token, expires_in, refresh_expires_in } = response.data;
        const result: LoginResult = {
            access_token: access_token as string,
            expires_in: expires_in as number,
            refresh_token: response.data.refresh_token as string,
            refresh_expires_in: refresh_expires_in as number,
        };
        this.#logger.debug('refresh: result=%o', result);
        return result;
    }

    async #getRoles(access_token: string) {
        let response: AxiosResponse<Record<string, any>>;
        try {
            response = await this.#keycloakClient.get(paths.userInfo, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });
        } catch {
            this.#logger.warn('#getRoles: Fehler bei %s', paths.userInfo);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { roles } =
            response.data.resource_access[keycloakConnectOptions.clientId!];

        this.#logger.debug('#getRoles: roles=%o', roles);
        return roles as string[];
    }
}
/* eslint-enable camelcase, @typescript-eslint/naming-convention */
