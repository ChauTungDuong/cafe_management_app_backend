import { TableEntity } from 'src/database/entity/table.entity';
import { Table } from './table.domain';

export class TableMapper {
  static toDomain(entity: TableEntity): Table {
    if (!entity) {
      return null;
    }
    const domain = new Table();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.seat = entity.seat;
    domain.status = entity.status;
    return domain;
  }

  static toEntity(domain: Table): TableEntity {
    if (!domain) {
      return null;
    }
    const entity = new TableEntity();
    if (domain.id && typeof domain.id === 'string') {
      entity.id = domain.id;
    }
    entity.name = domain.name;
    entity.seat = domain.seat;
    entity.status = domain.status;
    return entity;
  }
}
