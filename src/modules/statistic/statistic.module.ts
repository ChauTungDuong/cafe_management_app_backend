import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticEntity } from 'src/database/entity/statistic.entity';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';
import { StatisticRepository } from './statistic.repository';
import { OrderEntity } from 'src/database/entity/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StatisticEntity, OrderEntity])],
  controllers: [StatisticController],
  providers: [StatisticService, StatisticRepository],
  exports: [StatisticService],
})
export class StatisticModule {}
