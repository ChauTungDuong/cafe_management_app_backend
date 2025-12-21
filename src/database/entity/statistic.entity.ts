import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StatisticPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export interface TopProduct {
  itemId: string;
  itemName: string;
  totalQuantity: number;
  totalRevenue: number;
}

@Entity('statistics')
export class StatisticEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: StatisticPeriod,
  })
  period: StatisticPeriod;

  // Actual start date of the period being reported
  @Column({ type: 'date', nullable: true })
  startDate: Date;

  // Actual end date of the period being reported
  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  averageOrderValue: number;

  @Column({ type: 'int', default: 0 })
  totalProductsSold: number;

  @Column({ type: 'jsonb', nullable: true })
  topProducts: TopProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
