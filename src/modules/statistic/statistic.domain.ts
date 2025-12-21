import {
  StatisticPeriod,
  TopProduct,
  DailyBreakdown,
} from 'src/database/entity/statistic.entity';

export class Statistic {
  id: string;
  date: Date;
  period: StatisticPeriod;
  startDate?: Date;
  endDate?: Date;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProductsSold: number;
  topProducts: TopProduct[];
  dailyBreakdown?: DailyBreakdown[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
