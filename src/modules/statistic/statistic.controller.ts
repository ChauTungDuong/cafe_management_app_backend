import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { QueryStatisticDto } from './dto/query-statistic.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('statistics')
export class StatisticController {
  constructor(private statisticService: StatisticService) {}

  /**
   * Lấy danh sách thống kê với filters
   * Query params: startDate, endDate, period (daily/monthly)
   * Example: GET /statistics?startDate=2024-12-01&endDate=2024-12-14&period=daily
   */
  @Get()
  @Roles(Role.ADMIN)
  getStatistics(@Query() query: QueryStatisticDto) {
    return this.statisticService.getStatistics(query);
  }

  /**
   * Lấy thống kê theo ngày cụ thể
   * Hỗ trợ định dạng: YYYY-MM-DD hoặc DD/MM/YYYY
   * Example: GET /statistics/daily/2024-12-13 hoặc GET /statistics/daily/13/12/2024
   */
  @Get('daily/:date')
  @Roles(Role.ADMIN)
  getDailyStats(@Param('date') date: string) {
    return this.statisticService.getDailyStats(date);
  }

  /**
   * Lấy thống kê theo tháng cụ thể
   * Hỗ trợ định dạng: YYYY-MM hoặc DD/MM/YYYY
   * Example: GET /statistics/monthly/2024-12 hoặc GET /statistics/monthly/20/12/2024
   */
  @Get('monthly/:yearMonth')
  @Roles(Role.ADMIN)
  getMonthlyStats(@Param('yearMonth') yearMonth: string) {
    return this.statisticService.getMonthlyStats(yearMonth);
  }

  /**
   * Tạo thống kê thủ công cho 1 tháng gần nhất (30 ngày)
   * Tổng hợp toàn bộ dữ liệu 30 ngày gần nhất thành 1 bản ghi monthly
   * Date của bản ghi là ngày tạo statistic, period = monthly
   * Example: POST /statistics/generate
   */
  @Post('generate')
  @Roles(Role.ADMIN)
  async generateLastMonthStats() {
    return this.statisticService.generateLastMonthStats();
  }

  /**
   * Tạo thống kê thủ công cho khoảng thời gian tùy chỉnh
   * Tổng hợp toàn bộ dữ liệu trong khoảng thời gian thành 1 bản ghi monthly
   * Date của bản ghi là ngày tạo statistic, period = monthly
   * Query params: startDate, endDate
   * Example: POST /statistics/generate-range?startDate=2024-11-01&endDate=2024-12-14
   */
  @Post('generate-range')
  @Roles(Role.ADMIN)
  async generateStatsForRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticService.generateStatsForRange(startDate, endDate);
  }
}
