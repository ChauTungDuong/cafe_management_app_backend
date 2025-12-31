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
import { PriceUnitDto } from './create-ingredient.dto';

export class BulkIngredientItemDto {
  @IsString()
  name: string;

  @IsEnum(MeasureUnit)
  measureUnit: MeasureUnit;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAmount?: number;

  @ValidateNested()
  @Type(() => PriceUnitDto)
  pricePerUnit: PriceUnitDto;
}

export class BulkCreateIngredientDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkIngredientItemDto)
  ingredients: BulkIngredientItemDto[];
}
