import { IsNumber, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  method: string;

  @IsString()
  orderId: string;
}
