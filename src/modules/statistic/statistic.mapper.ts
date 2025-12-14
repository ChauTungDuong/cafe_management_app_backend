import { StatisticEntity } from 'src/database/entity/statistic.entity';
import { Statistic } from './statistic.domain';

export class StatisticMapper {
  static toDomain(entity: StatisticEntity): Statistic {
    if (!entity) {
      return null;
    }
    const domain = new Statistic();
    domain.id = entity.id;
    domain.date = entity.date;
    domain.period = entity.period;
    domain.totalRevenue = Number(entity.totalRevenue);
    domain.totalOrders = entity.totalOrders;
    domain.averageOrderValue = Number(entity.averageOrderValue);
    domain.totalProductsSold = entity.totalProductsSold;
    domain.topProducts = entity.topProducts || [];
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  static toEntity(domain: Statistic): StatisticEntity {
    if (!domain) {
      return null;
    }
    const entity = new StatisticEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.date = domain.date;
    entity.period = domain.period;
    entity.totalRevenue = domain.totalRevenue;
    entity.totalOrders = domain.totalOrders;
    entity.averageOrderValue = domain.averageOrderValue;
    entity.totalProductsSold = domain.totalProductsSold;
    entity.topProducts = domain.topProducts;
    return entity;
  }
}
