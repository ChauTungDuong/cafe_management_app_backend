import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { StatisticModule } from '../statistic/statistic.module';
import { TaxAndDiscountEntity } from 'src/database/entity/tax-and-discount.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaxAndDiscountEntity]), StatisticModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
