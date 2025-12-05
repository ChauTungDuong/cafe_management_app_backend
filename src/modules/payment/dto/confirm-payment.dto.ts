import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmPaymentDto {
  @IsNumber()
  id: number;

  @IsString()
  gateway: string;

  @IsString()
  transactionDate: string; // Format: "2025-11-30 11:00:58"

  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  code: string;

  @IsString()
  content: string;

  @IsString()
  transferType: string; // "in" or "out"

  @Type(() => Number)
  @IsNumber()
  transferAmount: number;

  @Type(() => Number)
  @IsNumber()
  accumulated: number;

  @IsOptional()
  @IsString()
  subAccount: string; // Virtual Account

  @IsString()
  referenceCode: string;

  @IsString()
  description: string;
}
