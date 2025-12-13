export enum TaxDiscountType {
  TAX = 'tax',
  DISCOUNT = 'discount',
}

export class Tax {
  id: string;
  name: string;
  description: string;
  percent: number;
  type: TaxDiscountType;
  isActive?: boolean;
  applyFrom?: Date;
  applyTo?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
