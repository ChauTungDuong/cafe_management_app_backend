import { Ingredient } from '../ingredient/ingredient.domain';

export class RecipeIngredient {
  id: string;
  ingredient?: Ingredient;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
