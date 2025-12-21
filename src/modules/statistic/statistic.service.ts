import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from 'src/database/entity/order.entity';
import { Repository } from 'typeorm';
import { StatisticRepository } from './statistic.repository';
import { StatisticPeriod } from 'src/database/entity/statistic.entity';
import { QueryStatisticDto } from './dto/query-statistic.dto';
import { parseDateAsUTC7 } from 'src/utils/timezone';
import { CreateReportDto, ReportType } from './dto/create-report.dto';

@Injectable()
export class StatisticService {
  private readonly logger = new Logger(StatisticService.name);

  constructor(
    private statisticRepository: StatisticRepository,
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
  ) {}

  /**
   * Create manual report based on report type
   */
  async createReport(dto: CreateReportDto) {
    const now = new Date();

    let startDate: Date;
    let endDate: Date;
    let period: StatisticPeriod;

    switch (dto.reportType) {
      case ReportType.WEEKLY:
        // Last 7 days from now
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6); // 7 days including today
        startDate.setHours(0, 0, 0, 0);

        period = StatisticPeriod.WEEKLY;

        // Check if weekly report already exists for this period
        const existingWeekly =
          await this.statisticRepository.findByDateRangeAndPeriod(
            startDate,
            endDate,
            period,
          );
        if (existingWeekly) {
          throw new ConflictException(
            `Báo cáo tuần cho khoảng ${startDate.toISOString().split('T')[0]} đến ${endDate.toISOString().split('T')[0]} đã tồn tại`,
          );
        }
        break;

      case ReportType.MONTHLY:
        // Last 30 days from now
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 29); // 30 days including today
        startDate.setHours(0, 0, 0, 0);

        period = StatisticPeriod.MONTHLY;

        // Check if monthly report already exists for this period
        const existingMonthly =
          await this.statisticRepository.findByDateRangeAndPeriod(
            startDate,
            endDate,
            period,
          );
        if (existingMonthly) {
          throw new ConflictException(
            `Báo cáo tháng cho khoảng ${startDate.toISOString().split('T')[0]} đến ${endDate.toISOString().split('T')[0]} đã tồn tại`,
          );
        }
        break;

      case ReportType.CUSTOM:
        if (!dto.startDate || !dto.endDate) {
          throw new BadRequestException(
            'startDate và endDate là bắt buộc cho báo cáo tùy chỉnh',
          );
        }

        startDate = parseDateAsUTC7(dto.startDate);
        endDate = parseDateAsUTC7(dto.endDate);

        if (!startDate || !endDate) {
          throw new BadRequestException(
            'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD hoặc DD/MM/YYYY',
          );
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        if (startDate > endDate) {
          throw new BadRequestException(
            'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
          );
        }

        period = StatisticPeriod.CUSTOM;

        // Check if custom report already exists for this exact range
        const existingCustom =
          await this.statisticRepository.findByDateRangeAndPeriod(
            startDate,
            endDate,
            period,
          );
        if (existingCustom) {
          throw new ConflictException(
            `Báo cáo tùy chỉnh cho khoảng ${startDate.toISOString().split('T')[0]} đến ${endDate.toISOString().split('T')[0]} đã tồn tại`,
          );
        }
        break;

      default:
        throw new BadRequestException('Loại báo cáo không hợp lệ');
    }

    this.logger.log(
      `Creating ${dto.reportType} report from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Fetch orders in the date range
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.item', 'item')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.status = :status', { status: 'paid' })
      .getMany();

    // Compute statistics
    const stats = this.computeStatistics(orders);

    // Compute daily breakdown for weekly/monthly reports
    let dailyBreakdown = null;
    if (
      period === StatisticPeriod.WEEKLY ||
      period === StatisticPeriod.MONTHLY
    ) {
      dailyBreakdown = this.computeDailyBreakdown(orders, startDate, endDate);
    }

    // Save report
    const report = await this.statisticRepository.create({
      date: now, // Report creation date
      period,
      startDate, // Actual period start
      endDate, // Actual period end
      ...stats,
      dailyBreakdown,
    });

    this.logger.log(
      `Report created: ${stats.totalOrders} orders, ${stats.totalRevenue} revenue`,
    );

    return {
      success: true,
      message: 'Báo cáo đã được tạo thành công',
      data: report,
    };
  }

  /**
   * Auto-generate weekly report (called by cron job)
   * Generates report for the previous complete week (Monday to Sunday)
   */
  async autoGenerateWeeklyReport() {
    const now = new Date();

    // Calculate previous week boundaries
    const lastMonday = new Date(now);
    const daysSinceMonday = (now.getDay() + 6) % 7; // 0 = Monday
    lastMonday.setDate(now.getDate() - daysSinceMonday - 7); // Go back to previous Monday
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6); // Sunday of that week
    lastSunday.setHours(23, 59, 59, 999);

    this.logger.log(
      `Auto-generating weekly report for ${lastMonday.toISOString().split('T')[0]} to ${lastSunday.toISOString().split('T')[0]}`,
    );

    // Check if report already exists
    const existing = await this.statisticRepository.findByDateRangeAndPeriod(
      lastMonday,
      lastSunday,
      StatisticPeriod.WEEKLY,
    );

    if (existing) {
      this.logger.warn('Weekly report already exists, skipping');
      return {
        success: false,
        message: 'Báo cáo tuần đã tồn tại',
      };
    }

    // Fetch and compute
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.item', 'item')
      .where('order.createdAt >= :startDate', { startDate: lastMonday })
      .andWhere('order.createdAt <= :endDate', { endDate: lastSunday })
      .andWhere('order.status = :status', { status: 'paid' })
      .getMany();

    const stats = this.computeStatistics(orders);
    const dailyBreakdown = this.computeDailyBreakdown(
      orders,
      lastMonday,
      lastSunday,
    );

    const report = await this.statisticRepository.create({
      date: new Date(),
      period: StatisticPeriod.WEEKLY,
      startDate: lastMonday,
      endDate: lastSunday,
      ...stats,
      dailyBreakdown,
    });

    this.logger.log(
      `Weekly report created: ${stats.totalOrders} orders, ${stats.totalRevenue} revenue`,
    );

    return {
      success: true,
      message: 'Báo cáo tuần đã được tạo tự động',
      data: report,
    };
  }

  /**
   * Auto-generate monthly report (called by cron job)
   * Generates report for the previous complete month
   */
  async autoGenerateMonthlyReport() {
    const now = new Date();
    const year =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth(); // Previous month

    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    this.logger.log(
      `Auto-generating monthly report for ${year}-${month.toString().padStart(2, '0')}`,
    );

    // Check if report already exists
    const existing = await this.statisticRepository.findByDateRangeAndPeriod(
      startOfMonth,
      endOfMonth,
      StatisticPeriod.MONTHLY,
    );

    if (existing) {
      this.logger.warn('Monthly report already exists, skipping');
      return {
        success: false,
        message: 'Báo cáo tháng đã tồn tại',
      };
    }

    // Fetch and compute
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.item', 'item')
      .where('order.createdAt >= :startDate', { startDate: startOfMonth })
      .andWhere('order.createdAt <= :endDate', { endDate: endOfMonth })
      .andWhere('order.status = :status', { status: 'paid' })
      .getMany();

    const stats = this.computeStatistics(orders);
    const dailyBreakdown = this.computeDailyBreakdown(
      orders,
      startOfMonth,
      endOfMonth,
    );

    const report = await this.statisticRepository.create({
      date: new Date(),
      period: StatisticPeriod.MONTHLY,
      startDate: startOfMonth,
      endDate: endOfMonth,
      ...stats,
      dailyBreakdown,
    });

    this.logger.log(
      `Monthly report created: ${stats.totalOrders} orders, ${stats.totalRevenue} revenue`,
    );

    return {
      success: true,
      message: 'Báo cáo tháng đã được tạo tự động',
      data: report,
    };
  }

  /**
   * Compute daily breakdown for multi-day reports
   */
  private computeDailyBreakdown(
    orders: OrderEntity[],
    startDate: Date,
    endDate: Date,
  ) {
    const dayNames = [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy',
    ];

    // Group orders by date
    const ordersByDate = new Map<string, OrderEntity[]>();

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const dateKey = orderDate.toISOString().split('T')[0];

      if (!ordersByDate.has(dateKey)) {
        ordersByDate.set(dateKey, []);
      }
      ordersByDate.get(dateKey).push(order);
    });

    // Generate daily breakdown for each day in range
    const breakdown = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      const dayOrders = ordersByDate.get(dateKey) || [];

      const revenue = dayOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0,
      );

      let productsSold = 0;
      dayOrders.forEach((order) => {
        order.orderItems?.forEach((item) => {
          productsSold += item.amount;
        });
      });

      breakdown.push({
        date: dateKey,
        dayOfWeek: current.getDay(),
        dayName: dayNames[current.getDay()],
        revenue,
        orders: dayOrders.length,
        productsSold,
      });

      current.setDate(current.getDate() + 1);
    }

    return breakdown;
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

      if (!startDate || !endDate) {
        throw new BadRequestException(
          'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD hoặc DD/MM/YYYY',
        );
      }
      return this.statisticRepository.findByDateRange(
        startDate,
        endDate,
        query.period,
      );
    }

    if (query.period) {
      return this.statisticRepository.findAll(query.period);
    }

    return this.statisticRepository.findAll();
  }

  /**
   * Get specific report by ID
   */
  async getReportById(id: string) {
    const report = await this.statisticRepository.findById(id);
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    return report;
  }
}
