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
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { JOSEError } from 'jose/errors';
import { keycloakConfig } from '../../config/keycloak.mts';
import { getLogger } from '../../logger/logger.mts';

const { issuer, jwksUri, clientId, audience } = keycloakConfig;
const jwks = createRemoteJWKSet(new URL(jwksUri));
const logger = getLogger('graphql/roles-required', 'file');

// Token aus dem Request Header extrahieren
const getToken = (headers: Headers) => {
    const auth = headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        throw new GraphQLError('Authorization im Header ist falsch', {
            extensions: {
                code: 'UNAUTHENTICATED',
            },
        });
    }
    const token = auth.slice(7);
    logger.debug('getToken: token=%s', token);
    return token;
};

// Base64 in JSON decodieren und verifizieren
const verifyToken = async (token: string) => {
    try {
        // https://github.com/panva/jose/blob/main/docs/jwt/verify/functions/jwtVerify.md
        // iat, exp und nbf werden implizit verifiziert
        return await jwtVerify(token, jwks, {
            // siehe Properties innerhalb der Payload des Tokens
            issuer,
            audience,
        });
    } catch (err) {
        logger.debug('verifyToken: verifyResult err=%o', err as any);
        if (err instanceof JOSEError) {
            // abgeleitet: JWTClaimValidationFailed, JWTExpired, ...
            throw new GraphQLError('Token nicht (mehr) gueltig', {
                extensions: {
                    code: 'UNAUTHENTICATED',
                },
            });
        }

        throw new GraphQLError((err as any).message ?? 'Unbekannter Fehler', {
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
            },
        });
    }
};

// Rollen aus der Payload des verifizierten JWTs extrahieren
// {
//   "exp": ...,
//   "iat": ...,
//   ...
//   "resource_access": {
//     "javascript-client": {
//       "roles": ["admin"]
//     }
const getRollen = (payload: any) => {
    const roles = payload?.resource_access?.[clientId]?.roles;
    if (!Array.isArray(roles)) {
        throw new GraphQLError('Erforderliche Rolle nicht vorhanden', {
            extensions: {
                code: 'FORBIDDEN',
            },
        });
    }
    logger.debug('getRollen: roles=%o', roles);
    return roles;
};

export const rolesRequired = async (request: Request, ...roles: string[]) => {
    // Token aus dem Request Header extrahieren
    const token = getToken(request.headers);

    // Base64 in JSON decodieren und verifizieren
    let jwt = await verifyToken(token);

    const { payload } = jwt;
    logger.debug('rolesRequired: payload=%o', payload);

    // Rollen aus der Payload bei resource_access.CLIENT_ID.roles extrahieren
    const rollenToken = getRollen(payload);

    // Ist eine der erforderlichen Rollen in der Payload vorhanden?
    const rolleVorhanden = roles.some((role) => rollenToken.includes(role));
    if (!rolleVorhanden) {
        throw new GraphQLError('Erforderliche Rolle nicht vorhanden', {
            extensions: {
                code: 'FORBIDDEN',
            },
        });
    }

    // Payload bzw. Claims des Tokens im Request puffern
    (request as any).tokenPayload = payload;
};
