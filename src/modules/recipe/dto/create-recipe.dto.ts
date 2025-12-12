import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';

export class RecipeIngredientItemDto {
  @IsString()
  ingredientId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;
}

export class CreateRecipeDto {
  @IsString()
  itemId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientItemDto)
  ingredients: RecipeIngredientItemDto[];
}
