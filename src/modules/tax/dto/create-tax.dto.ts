import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaxDiscountType } from '../tax.domain';

export class CreateTaxDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  percent: number;

  @IsEnum(TaxDiscountType)
  type: TaxDiscountType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  applyFrom?: string;

  @IsOptional()
  @IsDateString()
  applyTo?: string;
}
