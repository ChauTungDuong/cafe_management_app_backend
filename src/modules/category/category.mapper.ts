import { CategoryEntity } from 'src/database/entity/category.entity';
import { Category } from './category.domain';

export class CategoryMapper {
  static toDomain(entity: CategoryEntity): Category {
    if (!entity) {
      return null;
    }
    const domain = new Category();
    domain.id = entity.id;
    domain.name = entity.name;
    return domain;
  }

  static toEntity(domain: Category): CategoryEntity {
    if (!domain) {
      return null;
    }
    const entity = new CategoryEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    return entity;
  }
}
