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

// https://orm.drizzle.team/docs/column-types

import {
    boolean,
    check,
    customType,
    date,
    foreignKey,
    index,
    integer,
    jsonb,
    numeric,
    pgSchema,
    text,
    timestamp,
    unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const buchSchema = pgSchema('buch');
export const buchart = buchSchema.enum('buchart', ['EPUB', 'HARDCOVER', 'PAPERBACK']);

export const buchTable = buchSchema.table(
    'buch',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
        version: integer().default(0).notNull(),
        isbn: text().notNull(),
        rating: integer().default(0).notNull(),
        art: buchart(),
        preis: numeric({ precision: 8, scale: 2 }).notNull(),
        rabatt: numeric({ precision: 4, scale: 3 }).notNull(),
        lieferbar: boolean().default(false).notNull(),
        datum: date({ mode: 'date' }),
        homepage: text(),
        schlagwoerter: jsonb(),
        erzeugt: timestamp().defaultNow().notNull(),
        aktualisiert: timestamp().defaultNow().notNull(),
    },
    (table) => [
        unique('buch_isbn_key').on(table.isbn),
        check('buch_rating_check', sql`((rating >= 0) AND (rating <= 5))`),
    ],
);

export const titelTable = buchSchema.table(
    'titel',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
        titel: text().notNull(),
        untertitel: text(),
        buchId: integer('buch_id').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.buchId],
            foreignColumns: [buchTable.id],
            name: 'titel_buch_id_fkey',
        }).onDelete('cascade'),
        unique('titel_buch_id_key').on(table.buchId),
    ],
);

export const abbildungTable = buchSchema.table(
    'abbildung',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
        beschriftung: text().notNull(),
        contentType: text('content_type').notNull(),
        buchId: integer('buch_id').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.buchId],
            foreignColumns: [buchTable.id],
            name: 'abbildung_buch_id_fkey',
        }).onDelete('cascade'),
        index('abbildung_buch_id_idx').using('btree', table.buchId.asc().nullsLast()),
    ],
);

export const buchFileTable = buchSchema.table(
    'buch_file',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
        data: customType({ dataType: () => 'bytea' })().notNull(),
        filename: text().notNull(),
        mimetype: text(),
        buchId: integer('buch_id').notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.buchId],
            foreignColumns: [buchTable.id],
            name: 'buch_file_buch_id_fkey',
        }).onDelete('cascade'),
        index('buch_file_buch_id_idx').using('btree', table.buchId.asc().nullsLast()),
        unique('buch_file_buch_id_key').on(table.buchId),
    ],
);
