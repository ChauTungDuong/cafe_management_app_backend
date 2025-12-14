import {
  StatisticPeriod,
  TopProduct,
} from 'src/database/entity/statistic.entity';

export class Statistic {
  id: string;
  date: Date;
  period: StatisticPeriod;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProductsSold: number;
  topProducts: TopProduct[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
