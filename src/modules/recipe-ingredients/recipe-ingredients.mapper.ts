import { RecipeIngredientsEntity } from 'src/database/entity/recipe_ingredients.entity';
import { RecipeIngredient } from './rep-ing.domain';

export class RecipeIngredientsMapper {
  static toDomain(entity: RecipeIngredientsEntity): RecipeIngredient {
    if (!entity) {
      return null;
    }
    const domain = new RecipeIngredient();
    domain.id = entity.id;
    domain.ingredient = {
      id: entity.ingredient.id,
      name: entity.ingredient.name,
      amountLeft: entity.ingredient.amountLeft,
      measureUnit: entity.ingredient.measureUnit,
    };
    domain.amount = entity.amount;
    return domain;
  }
}
