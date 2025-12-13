import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  createdBy: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  taxDiscountIds?: string[];

  @IsString()
  tableId: string;

  @IsArray()
  @IsObject({ each: true })
  orderItems: {
    amount: number;
    itemId: string;
  }[];
}
