import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from 'src/database/entity/order.entity';
import { Repository } from 'typeorm';
import { StatisticRepository } from './statistic.repository';
import { StatisticPeriod } from 'src/database/entity/statistic.entity';
import { QueryStatisticDto } from './dto/query-statistic.dto';
import { parseDateAsUTC7 } from 'src/utils/timezone';

@Injectable()
export class StatisticService {
  private readonly logger = new Logger(StatisticService.name);

  constructor(
    private statisticRepository: StatisticRepository,
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
  ) {}

  /**
   * Calculate daily statistics for a specific date
   */
  async calculateDailyStats(date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    this.logger.log(
      `Calculating daily stats for ${date.toISOString().split('T')[0]}`,
    );

    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.item', 'item')
      .where('order.createdAt >= :startOfDay', { startOfDay })
      .andWhere('order.createdAt <= :endOfDay', { endOfDay })
      .andWhere('order.status = :status', { status: 'paid' })
      .getMany();

    const stats = this.computeStatistics(orders);

    await this.statisticRepository.upsert({
      date: startOfDay,
      period: StatisticPeriod.DAILY,
      ...stats,
    });

    this.logger.log(
      `Daily stats saved: ${stats.totalOrders} orders, ${stats.totalRevenue} revenue`,
    );
  }

  /**
   * Calculate monthly statistics for a specific year-month
   */
  async calculateMonthlyStats(year: number, month: number): Promise<void> {
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    this.logger.log(`Calculating monthly stats for ${year}-${month}`);

    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.item', 'item')
      .where('order.createdAt >= :startOfMonth', { startOfMonth })
      .andWhere('order.createdAt <= :endOfMonth', { endOfMonth })
      .andWhere('order.status = :status', { status: 'paid' })
      .getMany();

    const stats = this.computeStatistics(orders);

    await this.statisticRepository.upsert({
      date: startOfMonth,
      period: StatisticPeriod.MONTHLY,
      ...stats,
    });

    this.logger.log(
      `Monthly stats saved: ${stats.totalOrders} orders, ${stats.totalRevenue} revenue`,
    );
  }

  /**
   * Compute statistics from orders
   */
  private computeStatistics(orders: OrderEntity[]) {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate total products sold and top products
    const productMap = new Map<
      string,
      { itemId: string; itemName: string; quantity: number; revenue: number }
    >();

    let totalProductsSold = 0;

    orders.forEach((order) => {
      order.orderItems?.forEach((orderItem) => {
        totalProductsSold += orderItem.amount;

        const itemId = orderItem.item?.id || 'unknown';
        const itemName = orderItem.item?.name || 'Unknown';
        const quantity = orderItem.amount;
        const revenue = Number(orderItem.item?.price) * quantity;

        if (productMap.has(itemId)) {
          const existing = productMap.get(itemId);
          existing.quantity += quantity;
          existing.revenue += revenue;
        } else {
          productMap.set(itemId, {
            itemId,
            itemName,
            quantity,
            revenue,
          });
        }
      });
    });

    // Get top 5 products by quantity sold
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((p) => ({
        itemId: p.itemId,
        itemName: p.itemName,
        totalQuantity: p.quantity,
        totalRevenue: p.revenue,
      }));

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalProductsSold,
      topProducts,
    };
  }

  /**
   * Get statistics based on query filters
   */
  async getStatistics(query: QueryStatisticDto) {
    if (query.startDate && query.endDate) {
      const startDate = parseDateAsUTC7(query.startDate);
      const endDate = parseDateAsUTC7(query.endDate);
      return this.statisticRepository.findByDateRange(
        startDate,
        endDate,
        query.period,
      );
    }

    return this.statisticRepository.findAll();
  }

  /**
   * Get daily statistics for a specific date
   */
  async getDailyStats(dateString: string) {
    const date = parseDateAsUTC7(dateString);
    return this.statisticRepository.findByDateAndPeriod(
      date,
      StatisticPeriod.DAILY,
    );
  }

  /**
   * Get monthly statistics for a specific year-month
   */
  async getMonthlyStats(yearMonth: string) {
    // yearMonth format: YYYY-MM
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return this.statisticRepository.findByDateAndPeriod(
      date,
      StatisticPeriod.MONTHLY,
    );
  }

  /**
   * Generate statistics for the last 30 days (manual trigger)
   */
  async generateLastMonthStats() {
    this.logger.log('Generating statistics for last 30 days...');

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    let processedDays = 0;
    let failedDays = 0;

    // Generate daily stats for each day in the range
    for (
      let date = new Date(thirtyDaysAgo);
      date <= today;
      date.setDate(date.getDate() + 1)
    ) {
      try {
        await this.calculateDailyStats(new Date(date));
        processedDays++;
      } catch (error) {
        this.logger.error(
          `Failed to generate stats for ${date.toISOString().split('T')[0]}`,
          error.stack,
        );
        failedDays++;
      }
    }

    this.logger.log(
      `Completed: ${processedDays} days processed, ${failedDays} failed`,
    );

    return {
      success: true,
      message: `Generated statistics for last 30 days`,
      processed: processedDays,
      failed: failedDays,
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  }

  /**
   * Generate statistics for a custom date range (manual trigger)
   */
  async generateStatsForRange(startDateStr: string, endDateStr: string) {
    const startDate = parseDateAsUTC7(startDateStr);
    const endDate = parseDateAsUTC7(endDateStr);

    this.logger.log(
      `Generating statistics from ${startDateStr} to ${endDateStr}...`,
    );

    let processedDays = 0;
    let failedDays = 0;

    // Generate daily stats for each day in the range
    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      try {
        await this.calculateDailyStats(new Date(date));
        processedDays++;
      } catch (error) {
        this.logger.error(
          `Failed to generate stats for ${date.toISOString().split('T')[0]}`,
          error.stack,
        );
        failedDays++;
      }
    }

    // Also generate monthly stats for each month in the range
    const monthsSet = new Set<string>();
    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthsSet.add(monthKey);
    }

    let processedMonths = 0;
    for (const monthKey of monthsSet) {
      const [year, month] = monthKey.split('-').map(Number);
      try {
        await this.calculateMonthlyStats(year, month);
        processedMonths++;
      } catch (error) {
        this.logger.error(
          `Failed to generate monthly stats for ${year}-${month}`,
          error.stack,
        );
      }
    }

    this.logger.log(
      `Completed: ${processedDays} days, ${processedMonths} months processed`,
    );

    return {
      success: true,
      message: `Generated statistics for date range`,
      dailyStats: {
        processed: processedDays,
        failed: failedDays,
      },
      monthlyStats: {
        processed: processedMonths,
      },
      startDate: startDateStr,
      endDate: endDateStr,
    };
  }
}
