import { MeasureUnit } from 'src/utils/constant';

export class Ingredient {
  id: string;
  name: string;
  amountLeft: number;
  measureUnit: MeasureUnit;
  minAmount?: number;
  pricePerUnit: {
    price: number;
    unit: MeasureUnit;
  }
  image?: string;
  imagePublicId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
