import { MeasureUnit } from 'src/utils/constant';

export class Ingredient {
  id: string;
  name: string;
  amountLeft: number;
  measureUnit: MeasureUnit;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
