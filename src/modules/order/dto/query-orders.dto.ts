import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum OrderPaymentMethod {
  CASH = 'cash',
  QR = 'QR',
  CARD = 'card',
}

export enum OrderStatusFilter {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export class QueryOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatusFilter)
  status?: OrderStatusFilter;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsEnum(OrderPaymentMethod)
  paymentMethod?: OrderPaymentMethod;

  // YYYY-MM-DD or DD/MM/YYYY
  @IsOptional()
  @IsString()
  startDate?: string;

  // YYYY-MM-DD or DD/MM/YYYY
  @IsOptional()
  @IsString()
  endDate?: string;
}
