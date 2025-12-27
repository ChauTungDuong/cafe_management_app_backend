import { IsString } from 'class-validator';

export class CreateReportManualDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}
