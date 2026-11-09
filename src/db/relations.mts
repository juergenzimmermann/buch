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

import { abbildungTable, buchFileTable, buchTable, titelTable } from './schema.mts';
import { defineRelations } from 'drizzle-orm';

export const relations = defineRelations(
    { abbildungTable, buchTable, buchFileTable, titelTable },
    (rel) => {
        return {
            abbildungTable: {
                buchTable: rel.one.buchTable({
                    from: rel.abbildungTable.buchId,
                    to: rel.buchTable.id,
                }),
            },
            buchTable: {
                abbildungTable: rel.many.abbildungTable(),
                buchFileTable: rel.one.buchFileTable(),
                titelTable: rel.one.titelTable(),
            },
            buchFileTable: {
                buchTable: rel.one.buchTable({
                    from: rel.buchFileTable.buchId,
                    to: rel.buchTable.id,
                }),
            },
            titelTable: {
                buchTable: rel.one.buchTable({
                    from: rel.titelTable.buchId,
                    to: rel.buchTable.id,
                }),
            },
        };
    },
);
