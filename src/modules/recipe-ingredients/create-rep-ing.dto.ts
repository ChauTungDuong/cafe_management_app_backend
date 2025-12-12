import { IsString } from 'class-validator';

export class CreateRecipeIngredientsDto {
  @IsString()
  ingredientId: string;

  @IsString()
  recipeId: string;

  @IsString()
  amount: number;
}
