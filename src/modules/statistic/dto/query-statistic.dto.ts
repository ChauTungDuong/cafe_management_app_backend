import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatisticPeriod } from 'src/database/entity/statistic.entity';

export class QueryStatisticDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(StatisticPeriod)
  period?: StatisticPeriod;
}
