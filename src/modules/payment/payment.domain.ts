export class Payment {
  id: string;
  method: string;
  amount: number;
  qrCode: string;
  orderCode: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
