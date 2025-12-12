import { RecipeEntity } from 'src/database/entity/recipe.entity';
import { Recipe } from './recipe.domain';
import { ItemMapper } from '../item/item.mapper';
import { RecipeIngredientsMapper } from '../recipe-ingredients/recipe-ingredients.mapper';

export class RecipeMapper {
  static toDomain(entity: RecipeEntity): Recipe {
    if (!entity) {
      return null;
    }
    const domain = new Recipe();
    domain.id = entity.id;
    if (entity.item) {
      domain.item = {
        id: entity.item.id,
        name: entity.item.name,
        category: entity.item.category
          ? { name: entity.item.category.name }
          : null,
        price: entity.item.price,
        description: entity.item.description,
        status: entity.item.status,
      };
    }
    domain.recipeIngredients = entity.recipeIngredients.map((ri) =>
      RecipeIngredientsMapper.toDomain(ri),
    );
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  static toEntity(domain: Recipe): RecipeEntity {
    if (!domain) {
      return null;
    }
    const entity = new RecipeEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    return entity;
  }
}
