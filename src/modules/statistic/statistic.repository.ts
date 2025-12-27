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

  /**
   * Find report by exact date range and period
   */
  async findByDateRangeAndPeriod(
    startDate: Date,
    endDate: Date,
    period: StatisticPeriod,
  ): Promise<Statistic | null> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const entity = await this.statisticRepository
      .createQueryBuilder('stat')
      .where('stat.startDate = :startDate', { startDate: startDateStr })
      .andWhere('stat.endDate = :endDate', { endDate: endDateStr })
      .andWhere('stat.period = :period', { period })
      .getOne();

    return entity ? StatisticMapper.toDomain(entity) : null;
  }

  /**
   * Check if a weekly report exists for the week containing the given date
   */
  async findWeeklyReportForDate(date: Date): Promise<Statistic | null> {
    const { startOfWeek, endOfWeek } = this.getWeekBoundaries(date);
    return this.findByDateRangeAndPeriod(
      startOfWeek,
      endOfWeek,
      StatisticPeriod.WEEKLY,
    );
  }

  /**
   * Check if a monthly report exists for the month containing the given date
   */
  async findMonthlyReportForDate(date: Date): Promise<Statistic | null> {
    const { startOfMonth, endOfMonth } = this.getMonthBoundaries(date);
    return this.findByDateRangeAndPeriod(
      startOfMonth,
      endOfMonth,
      StatisticPeriod.MONTHLY,
    );
  }

  /**
   * Get week boundaries (Monday to Sunday)
   */
  private getWeekBoundaries(date: Date): {
    startOfWeek: Date;
    endOfWeek: Date;
  } {
    const current = new Date(date);
    const day = current.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday

    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

  /**
   * Get month boundaries
   */
  private getMonthBoundaries(date: Date): {
    startOfMonth: Date;
    endOfMonth: Date;
  } {
    const year = date.getFullYear();
    const month = date.getMonth();

    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return { startOfMonth, endOfMonth };
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

  async findAll(period?: StatisticPeriod): Promise<Statistic[]> {
    const where = period ? { period } : undefined;

    const entities = await this.statisticRepository.find({
      where,
      order: { date: 'DESC' },
    });
    return entities.map((e) => StatisticMapper.toDomain(e));
  }

  async findById(id: string): Promise<Statistic | null> {
    const entity = await this.statisticRepository.findOne({ where: { id } });
    return entity ? StatisticMapper.toDomain(entity) : null;
  }

  async findLatestByPeriod(period: StatisticPeriod): Promise<Statistic | null> {
    const entity = await this.statisticRepository
      .createQueryBuilder('stat')
      .where('stat.period = :period', { period })
      .orderBy('stat.date', 'DESC')
      .addOrderBy('stat.createdAt', 'DESC')
      .getOne();

    return entity ? StatisticMapper.toDomain(entity) : null;
  }
}
