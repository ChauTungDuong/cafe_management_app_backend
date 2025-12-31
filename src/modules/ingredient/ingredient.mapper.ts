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
    domain.pricePerUnit = {
      price: Number(entity.pricePerUnit?.price ?? 0),
      unit: (entity.pricePerUnit?.unit ?? entity.measureUnit) as any,
    };
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
    entity.pricePerUnit = {
      price: Number(domain.pricePerUnit?.price ?? 0),
      unit: domain.pricePerUnit?.unit ?? domain.measureUnit,
    } as any;
    entity.image = domain.image;
    entity.imagePublicId = domain.imagePublicId;
    return entity;
  }
}
