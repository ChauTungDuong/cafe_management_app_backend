import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateCategoryDto } from 'src/modules/category/dto/create-category.dto';

export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateCategoryDto)
  category: CreateCategoryDto;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsNumber()
  @Type(() => Number)
  amountLeft: number;

  @IsOptional()
  @IsString()
  description: string;

  @IsEnum(['available', 'out of stock', 'discontinued'])
  status: string;
}
