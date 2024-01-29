/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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

/**
 * Das Modul enthält die "NamingStrategy" für TypeORM für den Zugriff auf Oracle.
 * @packageDocumentation
 */
import { SnakeNamingStrategy } from './snake-naming-strategy.js';

// https://github.com/tonivj5/typeorm-naming-strategies/blob/master/src/snake-naming.strategy.ts
// https://github.com/typeorm/typeorm/blob/master/src/naming-strategy/DefaultNamingStrategy.ts
// https://github.com/typeorm/typeorm/blob/master/sample/sample12-custom-naming-strategy/naming-strategy/CustomNamingStrategy.ts
export class OracleNamingStrategy extends SnakeNamingStrategy {
    override tableName(targetName: string, userSpecifiedName: string): string {
        return super.tableName(targetName, userSpecifiedName).toUpperCase();
    }

    override columnName(
        propertyName: string,
        customName: string,
        embeddedPrefixes: string[],
    ) {
        return super
            .columnName(propertyName, customName, embeddedPrefixes)
            .toUpperCase();
    }

    override relationName(propertyName: string) {
        return super.relationName(propertyName).toUpperCase();
    }

    override joinColumnName(
        relationName: string,
        referencedColumnName: string,
    ) {
        return super
            .joinColumnName(relationName, referencedColumnName)
            .toUpperCase();
    }

    // eslint-disable-next-line max-params
    override joinTableName(
        firstTableName: string,
        secondTableName: string,
        firstPropertyName: string,
        secondPropertyName: string,
    ) {
        return super
            .joinTableName(
                firstTableName,
                secondTableName,
                firstPropertyName,
                secondPropertyName,
            )
            .toUpperCase();
    }

    override joinTableColumnName(
        tableName: string,
        propertyName: string,
        columnName?: string | undefined,
    ) {
        return super
            .joinTableColumnName(tableName, propertyName, columnName)
            .toUpperCase();
    }

    // eslint-disable-next-line unicorn/no-keyword-prefix
    override classTableInheritanceParentColumnName(
        parentTableName: any,
        parentTableIdPropertyName: any,
    ) {
        return super
            .classTableInheritanceParentColumnName(
                parentTableName,
                parentTableIdPropertyName,
            )
            .toUpperCase();
    }

    override eagerJoinRelationAlias(alias: string, propertyPath: string) {
        return super.eagerJoinRelationAlias(alias, propertyPath).toUpperCase();
    }
}
