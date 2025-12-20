import { Item } from '../item/item.domain';

export class Category {
  id: string;
  name: string;
  items?: Partial<Item>[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
