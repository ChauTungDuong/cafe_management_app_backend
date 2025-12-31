import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MeasureUnit } from 'src/utils/constant';

export class ImportIngredientItemDto {
  @IsString()
  ingredientId: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  // Optional: update latest unit cost on import
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pricePerUnit?: number;

  @IsOptional()
  @IsEnum(MeasureUnit)
  unit?: MeasureUnit;
}

export class ExportIngredientItemDto {
  @IsString()
  ingredientId: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;
}

export class ImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportIngredientItemDto)
  ingredients: ImportIngredientItemDto[];
}

export class ExportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExportIngredientItemDto)
  ingredients: ExportIngredientItemDto[];
}
