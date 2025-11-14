import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity('tax')
export class TaxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  percent: number;

  @OneToMany(() => OrderEntity, (order) => order.tax)
  orders: OrderEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
