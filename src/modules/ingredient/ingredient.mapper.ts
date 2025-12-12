import { IngredientEntity } from 'src/database/entity/ingredient.entity';
import { Ingredient } from './ingredient.domain';

export class IngredientMapper {
  static toDomain(entity: IngredientEntity): Ingredient {
    if (!entity) {
      return null;
    }
    const domain = new Ingredient();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.amountLeft = entity.amountLeft;
    domain.measureUnit = entity.measureUnit;
    return domain;
  }

  static toEntity(domain: Ingredient): IngredientEntity {
    if (!domain) {
      return null;
    }
    const entity = new IngredientEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.name = domain.name;
    entity.amountLeft = domain.amountLeft;
    entity.measureUnit = domain.measureUnit;
    return entity;
  }
}
