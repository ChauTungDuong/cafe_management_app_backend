import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { MeasureUnit } from 'src/utils/constant';

export class CreateIngredientDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  amountLeft: number;

  @IsEnum(MeasureUnit)
  measureUnit: MeasureUnit;
}
