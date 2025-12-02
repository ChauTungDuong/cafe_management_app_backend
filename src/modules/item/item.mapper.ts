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
    domainItem.category = raw.category;
    domainItem.price = raw.price;
    domainItem.amountLeft = raw.amountLeft;
    domainItem.description = raw.description;
    domainItem.status = raw.status;
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
    entityItem.amountLeft = domain.amountLeft;
    entityItem.description = domain.description;
    entityItem.status = domain.status;
    return entityItem;
  }

  static toDomainList(entities: ItemEntity[]): Item[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
