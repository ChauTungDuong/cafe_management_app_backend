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
    domain.startDate = entity.startDate;
    domain.endDate = entity.endDate;
    domain.totalRevenue = Number(entity.totalRevenue);
    domain.totalIngredientCost = Number(entity.totalIngredientCost);
    domain.grossProfit = Number(entity.grossProfit);
    domain.grossMarginPercent = Number(entity.grossMarginPercent);
    domain.totalOrders = entity.totalOrders;
    domain.averageOrderValue = Number(entity.averageOrderValue);
    domain.totalProductsSold = entity.totalProductsSold;
    domain.topProducts = entity.topProducts || [];
    domain.dailyBreakdown = entity.dailyBreakdown || null;
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
    entity.startDate = domain.startDate;
    entity.endDate = domain.endDate;
    entity.totalRevenue = domain.totalRevenue;
    entity.totalIngredientCost = domain.totalIngredientCost;
    entity.grossProfit = domain.grossProfit;
    entity.grossMarginPercent = domain.grossMarginPercent;
    entity.totalOrders = domain.totalOrders;
    entity.averageOrderValue = domain.averageOrderValue;
    entity.totalProductsSold = domain.totalProductsSold;
    entity.topProducts = domain.topProducts;
    entity.dailyBreakdown = domain.dailyBreakdown;
    return entity;
  }
}
