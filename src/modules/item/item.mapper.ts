import { ItemEntity } from 'src/database/entity/item.entity';
import { Item } from './item.domain';
import { CategoryEntity } from 'src/database/entity/category.entity';

export class ItemMapper {
  static toDomain(raw: ItemEntity): Item {
    if (!raw) {
      return null;
    }
    const domainItem = new Item();
    domainItem.id = raw.id;
    domainItem.name = raw.name;
    domainItem.category = raw.category
      ? {
          name: raw.category.name,
        }
      : null;
    domainItem.price = raw.price;
    domainItem.description = raw.description;
    domainItem.status = raw.status;
    if (raw.image) {
      domainItem.image = raw.image;
    }
    if (raw.imagePublicId) {
      domainItem.imagePublicId = raw.imagePublicId;
    }
    return domainItem;
  }

  static toEntity(domain: Item): ItemEntity {
    const entityItem = new ItemEntity();
    if (domain.id && typeof domain.id === 'string') {
      entityItem.id = domain.id;
    }
    if (domain.category) {
      const categoryEntity = new CategoryEntity();
      categoryEntity.name = domain.category.name;
      entityItem.category = categoryEntity;
    }
    entityItem.name = domain.name;
    entityItem.price = domain.price;
    entityItem.description = domain.description;
    entityItem.status = domain.status;
    return entityItem;
  }

  static toDomainList(entities: ItemEntity[]): Item[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
