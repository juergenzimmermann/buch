// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

/* eslint-disable max-classes-per-file, @typescript-eslint/no-magic-numbers */

import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsISBN,
    IsISO8601,
    IsInt,
    IsOptional,
    IsUrl,
    Matches,
    Max,
    Min,
    Validate,
    ValidateNested,
    type ValidationArguments,
    ValidatorConstraint,
    type ValidatorConstraintInterface,
} from 'class-validator';
import BigNumber from 'bignumber.js';
import { AbbildungDTO } from './abbildung-dto.js';
import { TitelDTO } from './titel-dto.js';
import { Buchart } from '../../generated/prisma/enums.js';

export const MAX_RATING = 5;

// https://github.com/typestack/class-transformer?tab=readme-ov-file#basic-usage
const number2Decimal = ({ value }: { value: BigNumber.Value | undefined }) => {
    if (value === undefined) {
        return;
    }

    // Decimal aus decimal.js analog zu BigDecimal von Java
    // precision wie bei SQL beim Spaltentyp DECIMAL bzw. NUMERIC
    BigNumber.set({ DECIMAL_PLACES: 6 });
    return BigNumber(value);
};

const number2Percent = ({ value }: { value: BigNumber.Value | undefined }) => {
    if (value === undefined) {
        return;
    }

    // precision wie bei SQL beim Spaltentyp DECIMAL bzw. NUMERIC
    BigNumber.set({ DECIMAL_PLACES: 4 });
    return BigNumber(value);
};

// https://github.com/typestack/class-validator?tab=readme-ov-file#custom-validation-classes
@ValidatorConstraint({ name: 'decimalMin', async: false })
class DecimalMin implements ValidatorConstraintInterface {
    validate(value: BigNumber | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [minValue]: BigNumber[] = args.constraints; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        return value.isGreaterThan(minValue!);
    }

    defaultMessage(args: ValidationArguments) {
        return `Der Wert muss groesser oder gleich ${(args.constraints[0] as BigNumber).toNumber()} sein.`;
    }
}

// https://github.com/typestack/class-validator?tab=readme-ov-file#custom-validation-classes
@ValidatorConstraint({ name: 'decimalMax', async: false })
class DecimalMax implements ValidatorConstraintInterface {
    validate(value: BigNumber | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [maxValue]: BigNumber[] = args.constraints; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        return value.isLessThan(maxValue!);
    }

    defaultMessage(args: ValidationArguments) {
        return `Der Wert muss kleiner oder gleich ${(args.constraints[0] as BigNumber).toNumber()} sein.`;
    }
}

/**
 * Entity-Klasse für Bücher ohne Referenzen.
 */
export class BuchDtoOhneRef {
    // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
    @IsISBN(13)
    @ApiProperty({ example: '978-0-007-00644-1', type: String })
    readonly isbn!: string;

    @IsInt()
    @Min(0)
    @Max(MAX_RATING)
    @ApiProperty({ example: 5, type: Number })
    readonly rating!: number;

    @Matches(/^(EPUB|HARDCOVER|PAPERBACK)$/u)
    @IsOptional()
    @ApiProperty({ example: 'EPUB', type: String })
    readonly art: Buchart | undefined;

    // https://github.com/typestack/class-transformer?tab=readme-ov-file#basic-usage
    @Transform(number2Decimal)
    @Validate(DecimalMin, [BigNumber(0)], {
        message: 'preis muss positiv sein.',
    })
    @ApiProperty({ example: 1, type: Number })
    // Decimal aus decimal.js analog zu BigDecimal von Java
    readonly preis!: BigNumber;

    @Transform(number2Percent)
    @Validate(DecimalMin, [BigNumber(0)], {
        message: 'rabatt muss positiv sein.',
    })
    @Validate(DecimalMax, [BigNumber(1)], {
        message: 'rabatt muss kleiner 1 sein.',
    })
    @IsOptional()
    @ApiProperty({ example: 0.1, type: Number })
    readonly rabatt: BigNumber | undefined;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true, type: Boolean })
    readonly lieferbar: boolean | undefined;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2021-01-31' })
    readonly datum: Date | string | undefined;

    @IsUrl()
    @IsOptional()
    @ApiProperty({ example: 'https://test.de/', type: String })
    readonly homepage: string | undefined;

    @IsOptional()
    @ArrayUnique()
    @ApiProperty({ example: ['JAVASCRIPT', 'TYPESCRIPT', 'JAVA', 'PYTHON'] })
    readonly schlagwoerter: string[] | undefined;
}

/**
 * Entity-Klasse für Bücher.
 */
export class BuchDTO extends BuchDtoOhneRef {
    @ValidateNested()
    @Type(() => TitelDTO)
    @ApiProperty({ type: TitelDTO })
    readonly titel!: TitelDTO; // NOSONAR

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AbbildungDTO)
    @ApiProperty({ type: [AbbildungDTO] })
    readonly abbildungen: AbbildungDTO[] | undefined;

    // AbbildungDTO
}
/* eslint-enable max-classes-per-file, @typescript-eslint/no-magic-numbers */
