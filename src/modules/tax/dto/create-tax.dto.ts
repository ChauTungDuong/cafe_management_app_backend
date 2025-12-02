import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaxDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  percent: number;
}
