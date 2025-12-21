import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { StatisticPeriod } from 'src/database/entity/statistic.entity';

export enum ReportType {
  WEEKLY = 'weekly', // Last 7 days
  MONTHLY = 'monthly', // Last 30 days
  CUSTOM = 'custom', // Custom range
}

export class CreateReportDto {
  @IsEnum(ReportType)
  reportType: ReportType;

  @ValidateIf((o) => o.reportType === ReportType.CUSTOM)
  @IsString()
  startDate?: string;

  @ValidateIf((o) => o.reportType === ReportType.CUSTOM)
  @IsString()
  endDate?: string;
}
