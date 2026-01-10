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
import { CreateReportManualDto } from './dto/create-report.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class StatisticService {
  private readonly logger = new Logger(StatisticService.name);

  private readonly utc7TimeZone = 'Asia/Bangkok';

  constructor(
    private statisticRepository: StatisticRepository,
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
  ) {}

  private formatDateUTC7(input?: Date | string | number): string {
    if (input === undefined || input === null || input === '') return '';

    let date: Date;
    if (input instanceof Date) {
      date = input;
    } else if (typeof input === 'number') {
      date = new Date(input);
    } else {
      // try parse with helper which understands YYYY-MM-DD and DD/MM/YYYY
      date = parseDateAsUTC7(input as string) || new Date(input as string);
    }

    if (!date || isNaN(date.getTime())) {
      // return empty string to avoid throwing RangeError from Intl
      return '';
    }

    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.utc7TimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private dateOnlyFromKey(dateKey: string): Date {
    // Store date-only values in UTC midnight so toISOString().split('T')[0] stays stable
    // and matches the intended YYYY-MM-DD.
    return new Date(`${dateKey}T00:00:00.000Z`);
  }

  private normalizeInputToUTC7DateKey(input: string): string {
    const parsed = parseDateAsUTC7(input);
    if (!parsed) {
      throw new BadRequestException(
        'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD hoặc DD/MM/YYYY',
      );
    }
    return this.formatDateUTC7(parsed);
  }

  private utc7DayStart(dateKey: string): Date {
    return new Date(`${dateKey}T00:00:00.000+07:00`);
  }

  private utc7DayEnd(dateKey: string): Date {
    return new Date(`${dateKey}T23:59:59.999+07:00`);
  }

  async getLatestReport(period: StatisticPeriod) {
    if (!period) {
      throw new BadRequestException('Thiếu tham số period');
    }
    const report = await this.statisticRepository.findLatestByPeriod(period);
    if (!report) {
      throw new NotFoundException('Chưa có báo cáo cho kỳ này');
    }
    return report;
  }

  /**
   * Create manual report based on report type
   */
  async createReport(dto: CreateReportManualDto) {
    const now = new Date();

    let startDate: Date;
    let endDate: Date;
    let period: StatisticPeriod.CUSTOM;
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException(
        'Báo cáo tùy chỉnh phải có ngày bắt đầu và ngày kết thúc',
      );
    }

    const startKey = this.normalizeInputToUTC7DateKey(dto.startDate);
    const endKey = this.normalizeInputToUTC7DateKey(dto.endDate);

    const startTs = this.utc7DayStart(startKey);
    const endTs = this.utc7DayEnd(endKey);

    const startDateOnly = this.dateOnlyFromKey(startKey);
    const endDateOnly = this.dateOnlyFromKey(endKey);

    if (startTs > endTs) {
      throw new BadRequestException(
        'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
      );
    }

    period = StatisticPeriod.CUSTOM;

    // Check if custom report already exists for this exact range
    const existingCustom =
      await this.statisticRepository.findByDateRangeAndPeriod(
        startDateOnly,
        endDateOnly,
        period,
      );
    if (existingCustom) {
      throw new ConflictException(
        `Báo cáo tùy chỉnh cho khoảng ${startKey} đến ${endKey} đã tồn tại`,
      );
    }
    this.logger.log(
      `Creating custom report from ${startTs.toISOString()} to ${endTs.toISOString()}`,
    );

    // Fetch orders in the date range
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.item', 'item')
      .where('order.createdAt >= :startDate', { startDate: startTs })
      .andWhere('order.createdAt <= :endDate', { endDate: endTs })
      .andWhere('order.status = :status', { status: 'paid' })
      .getMany();

    // Compute statistics
    const stats = this.computeStatistics(orders);

    // Compute daily breakdown for custom reports
    const dailyBreakdown = this.computeDailyBreakdown(orders, startTs, endTs);
    // Save report
    const report = await this.statisticRepository.create({
      date: this.dateOnlyFromKey(this.formatDateUTC7(now)), // Report creation date (date-only)
      period,
      startDate: startDateOnly, // Date-only
      endDate: endDateOnly, // Date-only
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

  // cron job

  async autoGenerateDailyReport() {
    const now = new Date();
    const todayKey = this.formatDateUTC7(now);
    const todayStart = this.utc7DayStart(todayKey);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayKey = this.formatDateUTC7(yesterdayStart);
    const startTs = this.utc7DayStart(yesterdayKey);
    const endTs = this.utc7DayEnd(yesterdayKey);
    const dateOnly = this.dateOnlyFromKey(yesterdayKey);

    this.logger.log(`Auto-generating daily report for ${yesterdayKey}`);

    const existing = await this.statisticRepository.findByDateRangeAndPeriod(
      dateOnly,
      dateOnly,
      StatisticPeriod.DAILY,
    );
    if (existing) {
      this.logger.warn('Daily report already exists, skipping');
      return {
        success: false,
        message: 'Báo cáo ngày đã tồn tại',
      };
    }
    // computing things
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.item', 'item')
      .where('order.createdAt >= :startDate', { startDate: startTs })
      .andWhere('order.createdAt <= :endDate', { endDate: endTs })
      .andWhere('order.status = :status', { status: 'paid' })
      .getMany();

    const stats = this.computeStatistics(orders);
    const dailyBreakdown = this.computeDailyBreakdown(orders, startTs, endTs);

    const report = await this.statisticRepository.create({
      date: dateOnly,
      period: StatisticPeriod.DAILY,
      startDate: dateOnly,
      endDate: dateOnly,
      ...stats,
      dailyBreakdown,
    });

    this.logger.log(
      `Daily report created: ${stats.totalOrders} orders, ${stats.totalRevenue} revenue`,
    );

    return {
      success: true,
      message: 'Báo cáo ngày đã được tạo tự động',
      data: report,
    };
  }
  async autoGenerateWeeklyReport() {
    const now = new Date();
    // Work with date-only (UTC+7) to avoid timezone drift
    const todayKey = this.formatDateUTC7(now);
    const todayDateOnlyUtc = this.dateOnlyFromKey(todayKey);
    const dow = todayDateOnlyUtc.getUTCDay(); // day-of-week of the UTC+7 calendar date
    const daysSinceMonday = (dow + 6) % 7; // 0 = Monday

    // Start of current week (Monday) in date-only UTC
    const currentWeekMonday = new Date(
      todayDateOnlyUtc.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000,
    );
    const lastMondayDateOnly = new Date(
      currentWeekMonday.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const lastSundayDateOnly = new Date(
      lastMondayDateOnly.getTime() + 6 * 24 * 60 * 60 * 1000,
    );

    const lastMondayKey = lastMondayDateOnly.toISOString().split('T')[0];
    const lastSundayKey = lastSundayDateOnly.toISOString().split('T')[0];
    const startTs = this.utc7DayStart(lastMondayKey);
    const endTs = this.utc7DayEnd(lastSundayKey);

    this.logger.log(
      `Auto-generating weekly report for ${lastMondayKey} to ${lastSundayKey}`,
    );

    // Check if report already exists
    const existing = await this.statisticRepository.findByDateRangeAndPeriod(
      lastMondayDateOnly,
      lastSundayDateOnly,
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
      .where('order.createdAt >= :startDate', { startDate: startTs })
      .andWhere('order.createdAt <= :endDate', { endDate: endTs })
      .andWhere('order.status = :status', { status: 'paid' })
      .getMany();

    const stats = this.computeStatistics(orders);
    const dailyBreakdown = this.computeDailyBreakdown(orders, startTs, endTs);

    const report = await this.statisticRepository.create({
      date: this.dateOnlyFromKey(this.formatDateUTC7(now)),
      period: StatisticPeriod.WEEKLY,
      startDate: lastMondayDateOnly,
      endDate: lastSundayDateOnly,
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

    // Date-only range in UTC (represents UTC+7 calendar dates)
    const startOfMonthDateOnly = new Date(
      Date.UTC(year, month - 1, 1, 0, 0, 0, 0),
    );
    const endOfMonthDateOnly = new Date(Date.UTC(year, month, 0, 0, 0, 0, 0));
    const startKey = startOfMonthDateOnly.toISOString().split('T')[0];
    const endKey = endOfMonthDateOnly.toISOString().split('T')[0];
    const startTs = this.utc7DayStart(startKey);
    const endTs = this.utc7DayEnd(endKey);

    this.logger.log(
      `Auto-generating monthly report for ${year}-${month.toString().padStart(2, '0')}`,
    );

    // Check if report already exists
    const existing = await this.statisticRepository.findByDateRangeAndPeriod(
      startOfMonthDateOnly,
      endOfMonthDateOnly,
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
      .where('order.createdAt >= :startDate', { startDate: startTs })
      .andWhere('order.createdAt <= :endDate', { endDate: endTs })
      .andWhere('order.status = :status', { status: 'paid' })
      .getMany();

    const stats = this.computeStatistics(orders);
    const dailyBreakdown = this.computeDailyBreakdown(orders, startTs, endTs);

    const report = await this.statisticRepository.create({
      date: this.dateOnlyFromKey(this.formatDateUTC7(now)),
      period: StatisticPeriod.MONTHLY,
      startDate: startOfMonthDateOnly,
      endDate: endOfMonthDateOnly,
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
      const dateKey = this.formatDateUTC7(orderDate);

      if (!ordersByDate.has(dateKey)) {
        ordersByDate.set(dateKey, []);
      }
      ordersByDate.get(dateKey).push(order);
    });

    // Generate daily breakdown for each day in range
    const breakdown = [];
    const startKey = this.formatDateUTC7(startDate);
    const endKey = this.formatDateUTC7(endDate);
    let current = this.utc7DayStart(startKey);
    const endDay = this.utc7DayStart(endKey);

    while (current <= endDay) {
      const dateKey = this.formatDateUTC7(current);
      const dayOrders = ordersByDate.get(dateKey) || [];

      const revenue = dayOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0,
      );

      const ingredientCost = dayOrders.reduce((sum, order) => {
        const cost = Number((order as any).ingredientCost ?? 0);
        return sum + (Number.isFinite(cost) ? cost : 0);
      }, 0);

      const grossProfit = revenue - ingredientCost;

      let productsSold = 0;
      dayOrders.forEach((order) => {
        order.orderItems?.forEach((item) => {
          productsSold += item.amount;
        });
      });

      breakdown.push({
        date: dateKey,
        dayOfWeek: new Date(`${dateKey}T00:00:00.000Z`).getUTCDay(),
        dayName: dayNames[new Date(`${dateKey}T00:00:00.000Z`).getUTCDay()],
        revenue,
        ingredientCost,
        grossProfit,
        orders: dayOrders.length,
        productsSold,
      });

      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
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

    const totalIngredientCost = orders.reduce((sum, order) => {
      const cost = Number((order as any).ingredientCost ?? 0);
      return sum + (Number.isFinite(cost) ? cost : 0);
    }, 0);

    const grossProfit = totalRevenue - totalIngredientCost;
    const grossMarginPercent =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
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
      totalIngredientCost,
      grossProfit,
      grossMarginPercent,
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
      const startKey = this.normalizeInputToUTC7DateKey(query.startDate);
      const endKey = this.normalizeInputToUTC7DateKey(query.endDate);
      const startDate = this.dateOnlyFromKey(startKey);
      const endDate = this.dateOnlyFromKey(endKey);

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

  async createExcelFile(id: string) {
    const statistic = await this.getReportById(id);
    if (!statistic) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    const normalizeJsonArray = <T>(value: any): T[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value as T[];
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? (parsed as T[]) : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    // Reuse style objects to avoid generating too many distinct styles (Excel may repair styles.xml)
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEFEFEF' },
    };

    const applyTableStyle = (
      sheet: ExcelJS.Worksheet,
      headerRowNumber: number,
      firstDataRowNumber: number,
    ) => {
      const headerRow = sheet.getRow(headerRowNumber);
      headerRow.font = { bold: true, size: 12 };
      headerRow.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      headerRow.height = 22;

      // Only style existing header cells
      headerRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.border = thinBorder;
      });

      const lastRowNumber = sheet.lastRow?.number ?? headerRowNumber;

      // Style borders for data cells (avoid includeEmpty to prevent styling huge empty areas)
      for (let r = firstDataRowNumber; r <= lastRowNumber; r++) {
        const row = sheet.getRow(r);
        row.eachCell((cell) => {
          cell.border = thinBorder;
        });
      }

      // Slightly nicer alignment for data rows
      for (let r = firstDataRowNumber; r <= lastRowNumber; r++) {
        const row = sheet.getRow(r);
        row.alignment = { vertical: 'middle', wrapText: true };
      }
    };

    const addMergedHeader = (
      sheet: ExcelJS.Worksheet,
      columnCount: number,
      title: string,
      subtitleLines: string[],
    ) => {
      // Layout:
      // Row 1: title (merged)
      // Row 2: subtitle (merged, may include line breaks)
      // Row 3: blank
      const lastCol = sheet.getColumn(columnCount).letter;
      sheet.mergeCells(`A1:${lastCol}1`);
      sheet.getCell('A1').value = title;
      sheet.getCell('A1').font = { bold: true, size: 16 };
      sheet.getCell('A1').alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      sheet.getRow(1).height = 36;

      sheet.mergeCells(`A2:${lastCol}2`);
      sheet.getCell('A2').value = subtitleLines.filter(Boolean).join('\n');
      sheet.getCell('A2').font = { italic: true, size: 11 };
      sheet.getCell('A2').alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      sheet.getRow(2).height = 70;

      sheet.getRow(3).height = 8;
    };

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Cafe Management';
    workbook.created = new Date();

    const createdKey = this.formatDateUTC7(statistic.date);
    const startKey = statistic.startDate
      ? this.formatDateUTC7(statistic.startDate)
      : '';
    const endKey = statistic.endDate
      ? this.formatDateUTC7(statistic.endDate)
      : '';
    const periodLabel: Record<string, string> = {
      [StatisticPeriod.DAILY]: 'Ngày',
      [StatisticPeriod.WEEKLY]: 'Tuần',
      [StatisticPeriod.MONTHLY]: 'Tháng',
      [StatisticPeriod.CUSTOM]: 'Tùy chỉnh',
    };
    const subtitleBase = [
      `Kỳ báo cáo: ${periodLabel[statistic.period] ?? statistic.period}`,
      startKey && endKey ? `Khoảng thời gian: ${startKey} → ${endKey}` : '',
      createdKey ? `Ngày tạo: ${createdKey}` : '',
      `Mã báo cáo: ${statistic.id}`,
    ].filter(Boolean);

    const topProducts = normalizeJsonArray<any>(statistic.topProducts);
    const dailyBreakdown = normalizeJsonArray<any>(statistic.dailyBreakdown);

    // Excel worksheet name max length is 31; keep it stable & valid.
    const worksheet = workbook.addWorksheet('Tổng quan');
    worksheet.columns = [
      { key: 'date', width: 15 },
      { key: 'startDate', width: 18 },
      { key: 'endDate', width: 18 },
      { key: 'totalRevenue', width: 21 },
      { key: 'totalIngredientCost', width: 22 },
      { key: 'grossProfit', width: 21 },
      { key: 'grossMarginPercent', width: 20 },
      { key: 'totalOrders', width: 21 },
      { key: 'totalProductsSold', width: 30 },
      { key: 'averageOrderValue', width: 33 },
    ];

    addMergedHeader(
      worksheet,
      10,
      'BÁO CÁO THỐNG KÊ - TỔNG QUAN',
      subtitleBase,
    );

    const overviewHeaderRow = worksheet.getRow(4);
    overviewHeaderRow.values = [
      'Ngày tạo',
      'Ngày bắt đầu',
      'Ngày kết thúc',
      'Tổng doanh thu',
      'Tổng chi nguyên liệu',
      'Lợi nhuận gộp',
      'Biên LN gộp (%)',
      'Tổng số đơn hàng',
      'Tổng số sản phẩm bán ra',
      'Giá trị đơn hàng trung bình',
    ];

    worksheet.addRow({
      date: createdKey,
      startDate: startKey,
      endDate: endKey,
      totalRevenue: statistic.totalRevenue,
      totalIngredientCost: (statistic as any).totalIngredientCost ?? 0,
      grossProfit: (statistic as any).grossProfit ?? 0,
      grossMarginPercent: (statistic as any).grossMarginPercent ?? 0,
      totalOrders: statistic.totalOrders,
      totalProductsSold: statistic.totalProductsSold,
      averageOrderValue: statistic.averageOrderValue,
    });

    worksheet.views = [{ state: 'frozen', ySplit: 4 }];
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: 10 },
    };

    worksheet.getColumn('totalRevenue').numFmt = '#,##0 đ';
    worksheet.getColumn('totalIngredientCost').numFmt = '#,##0 đ';
    worksheet.getColumn('grossProfit').numFmt = '#,##0 đ';
    worksheet.getColumn('grossMarginPercent').numFmt = '0.00"%"';
    worksheet.getColumn('averageOrderValue').numFmt = '#,##0 đ';
    applyTableStyle(worksheet, 4, 5);

    // top products sheet
    const topProductsSheet = workbook.addWorksheet('Sản phẩm bán chạy');
    topProductsSheet.columns = [
      { key: 'itemId', width: 36 },
      { key: 'itemName', width: 30 },
      { key: 'totalQuantity', width: 30 },
      { key: 'totalRevenue', width: 20 },
    ];

    addMergedHeader(
      topProductsSheet,
      4,
      'BÁO CÁO THỐNG KÊ - SẢN PHẨM BÁN CHẠY',
      subtitleBase,
    );
    const topHeaderRow = topProductsSheet.getRow(4);
    topHeaderRow.values = [
      'Mã sản phẩm',
      'Tên sản phẩm',
      'Tổng số lượng bán ra',
      'Tổng doanh thu',
    ];

    if (topProducts.length) {
      topProductsSheet.addRows(topProducts);
    }

    topProductsSheet.views = [{ state: 'frozen', ySplit: 4 }];
    topProductsSheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: 4 },
    };
    topProductsSheet.getColumn('totalRevenue').numFmt = '#,##0 đ';
    applyTableStyle(topProductsSheet, 4, 5);

    // detail daily breakdown sheet
    const dailySheet = workbook.addWorksheet('Báo cáo chi tiết theo ngày');
    dailySheet.columns = [
      { key: 'date', width: 15 },
      { key: 'dayName', width: 20 },
      { key: 'revenue', width: 20 },
      { key: 'ingredientCost', width: 22 },
      { key: 'grossProfit', width: 20 },
      { key: 'orders', width: 18 },
      { key: 'productsSold', width: 25 },
    ];

    addMergedHeader(
      dailySheet,
      7,
      'BÁO CÁO THỐNG KÊ - CHI TIẾT THEO NGÀY',
      subtitleBase,
    );
    const dailyHeaderRow = dailySheet.getRow(4);
    dailyHeaderRow.values = [
      'Ngày',
      'Ngày trong tuần',
      'Doanh thu',
      'Chi nguyên liệu',
      'Lợi nhuận gộp',
      'Số đơn hàng',
      'Số sản phẩm bán ra',
    ];

    if (dailyBreakdown.length) {
      dailySheet.addRows(dailyBreakdown);
    }

    dailySheet.views = [{ state: 'frozen', ySplit: 4 }];
    dailySheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: 7 },
    };
    dailySheet.getColumn('revenue').numFmt = '#,##0 đ';
    dailySheet.getColumn('ingredientCost').numFmt = '#,##0 đ';
    dailySheet.getColumn('grossProfit').numFmt = '#,##0 đ';
    applyTableStyle(dailySheet, 4, 5);

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
