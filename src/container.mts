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

import { BuchService } from './buch/service/buch-service.mts';
import { BuchWriteService } from './buch/service/buch-write-service.mts';
import { DbPopulateService } from './config/dev/db-populate.mts';
import { KeycloakService } from './security/keycloak-service.mts';

const buchService = new BuchService();

/**
 * Container mit Singletons zur Emulation von manueller DI (ähnlich wie ein
 * Container beim Spring Framework.
 *
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const container = {
    buchService,
    buchWriteService: new BuchWriteService(buchService),
    keycloakService: new KeycloakService(),
    dbPopulateService: new DbPopulateService(),
};
