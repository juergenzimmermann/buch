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
// along with this program. If not, see <http://www.gnu.org/licenses/>.

// oxlint-disable-next-line import/no-unassigned-import
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
// @ts-expect-error Datei nicht im Verzeichnis src
import process from 'node:process';

const { DATABASE_URL } = process.env;
if (DATABASE_URL === undefined) {
    throw new Error('DATABASE_URL ist nicht gesetzt in .env');
}

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
    dialect: 'postgresql',
    dbCredentials: {
        url: DATABASE_URL,
    },
    schemaFilter: ['buch'],
    out: './drizzle',

    // fuer Drizzle Studio
    schema: 'src/db/schema.mts',
});
