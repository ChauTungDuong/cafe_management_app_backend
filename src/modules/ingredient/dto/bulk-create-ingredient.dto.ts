import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
  IsOptional,
} from 'class-validator';
import { MeasureUnit } from 'src/utils/constant';

export class BulkIngredientItemDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountLeft: number;

  @IsEnum(MeasureUnit)
  measureUnit: MeasureUnit;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAmount?: number;
}

export class BulkCreateIngredientDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkIngredientItemDto)
  ingredients: BulkIngredientItemDto[];
}
