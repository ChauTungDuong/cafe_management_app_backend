import { Category } from '../category/category.domain';

export class Item {
  id: string;
  name: string;
  category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
  price: number;
  amountLeft: number;
  description: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
