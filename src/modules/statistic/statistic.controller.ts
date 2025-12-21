import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { QueryStatisticDto } from './dto/query-statistic.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('statistics')
export class StatisticController {
  constructor(private statisticService: StatisticService) {}

  /**
   * Tạo báo cáo thủ công
   * Body: { reportType: 'weekly' | 'monthly' | 'custom', startDate?, endDate? }
   * - weekly: 7 ngày gần nhất
   * - monthly: 30 ngày gần nhất
   * - custom: khoảng thời gian tùy chỉnh (yêu cầu startDate & endDate)
   */
  @Post('reports')
  @Roles(Role.ADMIN)
  createReport(@Body() dto: CreateReportDto) {
    return this.statisticService.createReport(dto);
  }

  /**
   * Lấy danh sách báo cáo với filters
   * Query params: startDate, endDate, period (daily/weekly/monthly/custom)
   */
  @Get('reports')
  @Roles(Role.ADMIN)
  getReports(@Query() query: QueryStatisticDto) {
    return this.statisticService.getStatistics(query);
  }

  /**
   * Lấy báo cáo theo ID
   */
  @Get('reports/:id')
  @Roles(Role.ADMIN)
  getReportById(@Param('id') id: string) {
    return this.statisticService.getReportById(id);
  }
}
