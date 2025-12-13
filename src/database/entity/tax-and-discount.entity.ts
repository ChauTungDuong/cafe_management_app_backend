import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
} from 'typeorm';
import { OrderEntity } from './order.entity';

export enum TaxDiscountType {
  TAX = 'tax',
  DISCOUNT = 'discount',
}

@Entity('tax_and_discount')
export class TaxAndDiscountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  percent: number;

  @Column({
    type: 'enum',
    enum: TaxDiscountType,
    default: TaxDiscountType.TAX,
  })
  type: TaxDiscountType;

  @Column({ nullable: true, default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  applyFrom?: Date;

  @Column({ type: 'timestamp', nullable: true })
  applyTo?: Date;

  @ManyToMany(() => OrderEntity, (order) => order.taxesAndDiscounts)
  orders: OrderEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
