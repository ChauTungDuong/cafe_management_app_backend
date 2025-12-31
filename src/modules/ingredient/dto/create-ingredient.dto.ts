import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MeasureUnit } from 'src/utils/constant';

export class PriceUnitDto {
  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsEnum(MeasureUnit)
  unit: MeasureUnit;
}

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsEnum(MeasureUnit)
  measureUnit: MeasureUnit;

  @IsOptional()
  @IsString()
  image?: string;

  @ValidateNested()
  @Type(() => PriceUnitDto)
  pricePerUnit: PriceUnitDto;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAmount?: number;

  @IsOptional()
  @IsString()
  imagePublicId?: string;
}
