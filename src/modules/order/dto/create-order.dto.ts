import { IsArray, IsEnum, IsNumber, IsObject, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  discount: number;

  @IsString()
  createdBy: string;

  @IsString()
  taxId: string;

  @IsString()
  tableId: string;

  @IsArray()
  @IsObject({ each: true })
  orderItems: {
    amount: number;
    itemId: string;
  }[];
}
