import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  StatisticEntity,
  StatisticPeriod,
} from 'src/database/entity/statistic.entity';
import { Between, Repository } from 'typeorm';
import { Statistic } from './statistic.domain';
import { StatisticMapper } from './statistic.mapper';

@Injectable()
export class StatisticRepository {
  constructor(
    @InjectRepository(StatisticEntity)
    private statisticRepository: Repository<StatisticEntity>,
  ) {}

  async create(data: Partial<StatisticEntity>): Promise<Statistic> {
    const entity = this.statisticRepository.create(data);
    const saved = await this.statisticRepository.save(entity);
    return StatisticMapper.toDomain(saved);
  }

  async findByDateAndPeriod(
    date: Date,
    period: StatisticPeriod,
  ): Promise<Statistic | null> {
    const entity = await this.statisticRepository.findOne({
      where: { date, period },
    });
    return entity ? StatisticMapper.toDomain(entity) : null;
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    period?: StatisticPeriod,
  ): Promise<Statistic[]> {
    const query = this.statisticRepository
      .createQueryBuilder('stat')
      .where('stat.date >= :startDate', { startDate })
      .andWhere('stat.date <= :endDate', { endDate });

    if (period) {
      query.andWhere('stat.period = :period', { period });
    }

    query.orderBy('stat.date', 'DESC');

    const entities = await query.getMany();
    return entities.map((e) => StatisticMapper.toDomain(e));
  }

  async upsert(data: Partial<StatisticEntity>): Promise<Statistic> {
    const existing = await this.findByDateAndPeriod(data.date, data.period);

    if (existing) {
      const updated = await this.statisticRepository.save({
        ...data,
        id: existing.id,
      });
      return StatisticMapper.toDomain(updated);
    }

    return this.create(data);
  }

  async findAll(): Promise<Statistic[]> {
    const entities = await this.statisticRepository.find({
      order: { date: 'DESC' },
    });
    return entities.map((e) => StatisticMapper.toDomain(e));
  }
}
