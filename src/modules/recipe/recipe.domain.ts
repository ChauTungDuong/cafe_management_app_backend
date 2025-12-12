import { Item } from '../item/item.domain';
import { RecipeIngredient } from '../recipe-ingredients/rep-ing.domain';

export class Recipe {
  id: string;
  item?: Omit<Item, 'image' | 'imagePublicId'>;
  recipeIngredients?: RecipeIngredient[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
