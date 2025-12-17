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
   * Accepts formats: YYYY-MM-DD, DD/MM/YYYY (e.g., 2024-12-13 or 13/12/2024)
   */
  async getDailyStats(dateString: string) {
    const date = parseDateAsUTC7(dateString);
    if (!date) {
      throw new Error('Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY');
    }
    return this.statisticRepository.findByDateAndPeriod(
      date,
      StatisticPeriod.DAILY,
    );
  }

  /**
   * Get monthly statistics for a specific year-month
   * Accepts formats: YYYY-MM, DD/MM/YYYY (e.g., 2024-12 or 20/12/2024)
   */
  async getMonthlyStats(yearMonth: string) {
    let year: number;
    let month: number;

    // Check if format is DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(yearMonth)) {
      const parsed = parseDateAsUTC7(yearMonth);
      if (!parsed) {
        throw new Error('Invalid date format');
      }
      year = parsed.getFullYear();
      month = parsed.getMonth() + 1;
    } else if (/^\d{4}-\d{2}$/.test(yearMonth)) {
      // YYYY-MM format
      [year, month] = yearMonth.split('-').map(Number);
    } else {
      throw new Error('Invalid format. Use YYYY-MM or DD/MM/YYYY');
    }

    return this.statisticRepository.findMonthlyStatsByYearMonth(year, month);
  }

  /**
   * Generate statistics for the last 30 days (manual trigger)
   * Tổng hợp toàn bộ dữ liệu 30 ngày gần nhất thành 1 bản ghi monthly
   */
  async generateLastMonthStats() {
    this.logger.log('Generating monthly statistics for last 30 days...');

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    try {
      // Lấy tất cả orders trong 30 ngày gần nhất
      const orders = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.orderItems', 'orderItems')
        .leftJoinAndSelect('orderItems.item', 'item')
        .where('order.createdAt >= :startDate', { startDate: thirtyDaysAgo })
        .andWhere('order.createdAt <= :endDate', { endDate: today })
        .andWhere('order.status = :status', { status: 'paid' })
        .getMany();

      // Tính toán thống kê tổng hợp
      const stats = this.computeStatistics(orders);

      // Lưu 1 bản ghi duy nhất với date là ngày hiện tại và period = monthly
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      await this.statisticRepository.upsert({
        date: currentDate,
        period: StatisticPeriod.MONTHLY,
        ...stats,
      });

      this.logger.log(
        `Monthly stats saved: ${stats.totalOrders} orders, ${stats.totalRevenue} revenue`,
      );

      return {
        success: true,
        message: `Generated monthly statistics for last 30 days`,
        data: {
          date: currentDate.toISOString().split('T')[0],
          period: StatisticPeriod.MONTHLY,
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          ...stats,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate monthly stats', error.stack);
      return {
        success: false,
        message: 'Failed to generate statistics',
        error: error.message,
      };
    }
  }

  /**
   * Generate statistics for a custom date range (manual trigger)
   * Tổng hợp toàn bộ dữ liệu trong khoảng thời gian thành 1 bản ghi monthly
   */
  async generateStatsForRange(startDateStr: string, endDateStr: string) {
    const startDate = parseDateAsUTC7(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = parseDateAsUTC7(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    this.logger.log(
      `Generating monthly statistics from ${startDateStr} to ${endDateStr}...`,
    );

    try {
      // Lấy tất cả orders trong khoảng thời gian
      const orders = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.orderItems', 'orderItems')
        .leftJoinAndSelect('orderItems.item', 'item')
        .where('order.createdAt >= :startDate', { startDate })
        .andWhere('order.createdAt <= :endDate', { endDate })
        .andWhere('order.status = :status', { status: 'paid' })
        .getMany();

      // Tính toán thống kê tổng hợp
      const stats = this.computeStatistics(orders);

      // Lưu 1 bản ghi duy nhất với date là ngày hiện tại và period = monthly
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      await this.statisticRepository.upsert({
        date: currentDate,
        period: StatisticPeriod.MONTHLY,
        ...stats,
      });

      this.logger.log(
        `Monthly stats saved: ${stats.totalOrders} orders, ${stats.totalRevenue} revenue`,
      );

      return {
        success: true,
        message: `Generated monthly statistics for date range`,
        data: {
          date: currentDate.toISOString().split('T')[0],
          period: StatisticPeriod.MONTHLY,
          startDate: startDateStr,
          endDate: endDateStr,
          ...stats,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate monthly stats for range',
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to generate statistics',
        error: error.message,
      };
    }
  }
}
