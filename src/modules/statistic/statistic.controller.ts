import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { StatisticService } from './statistic.service';
import { QueryStatisticDto } from './dto/query-statistic.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { CreateReportManualDto } from './dto/create-report.dto';
import { StatisticPeriod } from 'src/database/entity/statistic.entity';

@Controller('statistics')
export class StatisticController {
  constructor(private statisticService: StatisticService) {}

  @Post()
  @Roles(Role.ADMIN)
  createReport(@Body() dto: CreateReportManualDto) {
    return this.statisticService.createReport(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  getReports(@Query() query: QueryStatisticDto) {
    return this.statisticService.getStatistics(query);
  }

  @Get('latest')
  @Roles(Role.ADMIN)
  getLatestReport(@Query('period') period: StatisticPeriod) {
    return this.statisticService.getLatestReport(period);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  getReportById(@Param('id') id: string) {
    return this.statisticService.getReportById(id);
  }

  @Get(':id/excel')
  @Roles(Role.ADMIN)
  async getReportExcel(@Param('id') id: string, @Res() res: Response) {
    const excelBuffer = await this.statisticService.createExcelFile(id);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Bao_cao_${id}.xlsx`,
    });

    res.send(Buffer.from(excelBuffer as any));
    return;
  }
}
