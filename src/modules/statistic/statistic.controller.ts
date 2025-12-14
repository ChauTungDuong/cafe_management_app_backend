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
   * Example: GET /statistics/daily/2024-12-13
   */
  @Get('daily/:date')
  @Roles(Role.ADMIN)
  getDailyStats(@Param('date') date: string) {
    return this.statisticService.getDailyStats(date);
  }

  /**
   * Lấy thống kê theo tháng cụ thể
   * Example: GET /statistics/monthly/2024-12
   */
  @Get('monthly/:yearMonth')
  @Roles(Role.ADMIN)
  getMonthlyStats(@Param('yearMonth') yearMonth: string) {
    return this.statisticService.getMonthlyStats(yearMonth);
  }

  /**
   * Tạo thống kê thủ công cho 1 tháng gần nhất (30 ngày)
   * Tính toán daily stats cho mỗi ngày từ 30 ngày trước đến hôm nay
   * Example: POST /statistics/generate-last-month
   */
  @Post('generate')
  @Roles(Role.ADMIN)
  async generateLastMonthStats() {
    return this.statisticService.generateLastMonthStats();
  }

  /**
   * Tạo thống kê thủ công cho khoảng thời gian tùy chỉnh
   * Body: { startDate: "2024-11-01", endDate: "2024-12-14" }
   * Example: POST /statistics/generate-range
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
