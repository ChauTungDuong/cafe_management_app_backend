import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTableDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  seat: number;

  @IsOptional()
  @IsEnum(['available', 'occupied', 'reserved'])
  status: 'available' | 'occupied' | 'reserved';
}
