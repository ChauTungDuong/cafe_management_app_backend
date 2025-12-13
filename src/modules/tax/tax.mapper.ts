import { TaxAndDiscountEntity } from 'src/database/entity/tax-and-discount.entity';
import { Tax } from './tax.domain';

export class TaxMapper {
  static toDomain(entity: TaxAndDiscountEntity): Tax {
    if (!entity) {
      return null;
    }
    const domain = new Tax();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.percent = entity.percent;
    domain.type = entity.type;
    domain.isActive = entity.isActive;
    domain.applyFrom = entity.applyFrom;
    domain.applyTo = entity.applyTo;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  static toEntity(domain: Tax): TaxAndDiscountEntity {
    if (!domain) {
      return null;
    }
    const entity = new TaxAndDiscountEntity();
    if (domain.id && typeof domain.id === 'string') {
      entity.id = domain.id;
    }
    entity.name = domain.name;
    entity.description = domain.description;
    entity.percent = domain.percent;
    entity.type = domain.type;
    entity.isActive = domain.isActive;
    entity.applyFrom = domain.applyFrom;
    entity.applyTo = domain.applyTo;
    return entity;
  }
}
