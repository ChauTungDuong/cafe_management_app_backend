import { IsNumber } from 'class-validator';

export class ConfirmPaymentDto {
  id: number;
  gateway: string;
  transactionDate: Date;
  accountNumber: string;
  code: string;
  content: string;
  transferType: string;
  transferAmount: number;
  accumulated: number;
  subAccount: string;
  referenceCode: string;
  description: string;
}
