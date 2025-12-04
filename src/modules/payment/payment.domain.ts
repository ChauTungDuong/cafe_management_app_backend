export class Payment {
  id: string;
  method: string;
  amount: number;
  qrCode: string;
  qrCodePublicId?: string;
  orderCode: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
