import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GetLogsQueryDto } from './dto/get-logs.dto';
import { LogEntity } from 'src/database/entity/log.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(LogEntity)
    private readonly logRepository: Repository<LogEntity>,
  ) {}

  async list(query: GetLogsQueryDto) {
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 20);
    const skip = (page - 1) * limit;

    const qb = this.logRepository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query?.action)
      qb.andWhere('log.action = :action', { action: query.action });
    if (query?.entityType)
      qb.andWhere('log.entityType = :entityType', {
        entityType: query.entityType,
      });
    if (query?.entityId)
      qb.andWhere('log.entityId = :entityId', { entityId: query.entityId });
    if (query?.userId)
      qb.andWhere('log.userId = :userId', { userId: query.userId });

    if (query?.from) {
      const fromDate = new Date(query.from);
      if (!Number.isNaN(fromDate.getTime())) {
        qb.andWhere('log.createdAt >= :from', { from: fromDate.toISOString() });
      }
    }
    if (query?.to) {
      const toDate = new Date(query.to);
      if (!Number.isNaN(toDate.getTime())) {
        qb.andWhere('log.createdAt <= :to', { to: toDate.toISOString() });
      }
    }

    if (query?.q) {
      qb.andWhere(
        '(log.message ILIKE :q OR log.entityName ILIKE :q OR log.userName ILIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async write(entry: Partial<LogEntity>) {
    // Best-effort logging; never break the main request
    try {
      await this.logRepository.save(this.logRepository.create(entry));
    } catch {
      // swallow
    }
  }
}
