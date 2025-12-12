import { Category } from '../category/category.domain';

export class Item {
  id: string;
  name: string;
  category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
  price: number;
  description: string;
  image: string;
  imagePublicId?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
