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

import ISBN from 'isbn3';
import { z } from 'zod';

export const MAX_RATING = 5;

const BuchComplete = z.strictObject({
    // bei GraphQL ist der Typ ID i.a. ein String
    id: z.union([z.number().int().gt(0), z.string().regex(/^[1-9]\d*$/)]),
    version: z.int().gte(0),
    isbn: z
        .string()
        .refine((isbnStr) => ISBN.parse(isbnStr)?.isValid === true, {
            message: 'Ungültige ISBN-Nummer',
        }),
    rating: z.int().gte(0).lte(MAX_RATING),
    art: z.enum(['EPUB', 'HARDCOVER', 'PAPERBACK']).optional(),
    preis: z.number().gte(0),
    rabatt: z.number().gt(0).lt(1).optional(),
    lieferbar: z.boolean().optional(),
    // TODO Zod verwendet den Konstruktor von Date, so dass 2025-02-30 zu 2025-03-02 wird
    datum: z.coerce.date().optional(),
    homepage: z.httpUrl().optional(),
    schlagwoerter: z.array(z.string()).optional(),

    titel: z.strictObject({
        titel: z.string().regex(/^\w.*/).max(40),
        untertitel: z.string().max(40).optional(),
    }),
    abbildungen: z
        .array(
            z.strictObject({
                beschriftung: z.string().max(32),
                contentType: z.string().max(16),
            }),
        )
        .optional(),
});
export const BuchNeuSchema = BuchComplete.omit({
    id: true,
    version: true,
}).readonly();

export const BuchUpdateSchema = BuchComplete.omit({
    id: true,
    version: true,
    titel: true,
    abbildungen: true,
}).readonly();

export const BuchUpdateGraphQLSchema = BuchComplete.omit({
    titel: true,
    abbildungen: true,
}).readonly();

export type BuchNeuType = z.infer<typeof BuchNeuSchema>;
export type BuchUpdateType = z.infer<typeof BuchUpdateSchema>;
