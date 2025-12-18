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
    domain.imagePublicId = entity.imagePublicId;
    domain.image = entity.image;
    domain.minAmount = entity.minAmount;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
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
    entity.minAmount = domain.minAmount;
    entity.image = domain.image;
    entity.imagePublicId = domain.imagePublicId;
    return entity;
  }
}
