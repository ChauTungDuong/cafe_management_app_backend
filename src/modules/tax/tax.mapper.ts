import { TaxEntity } from 'src/database/entity/tax.entity';
import { Tax } from './tax.domain';

export class TaxMapper {
  static toDomain(entity: TaxEntity): Tax {
    if (!entity) {
      return null;
    }
    const domain = new Tax();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.percent = entity.percent;
    return domain;
  }

  static toEntity(domain: Tax): TaxEntity {
    if (!domain) {
      return null;
    }
    const entity = new TaxEntity();
    if (domain.id && typeof domain.id === 'string') {
      entity.id = domain.id;
    }
    entity.name = domain.name;
    entity.description = domain.description;
    entity.percent = domain.percent;
    return entity;
  }
}
