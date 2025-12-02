import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItemEntity } from './order_item.entity';
import { UsersEntity } from './users.entity';
import { TaxEntity } from './tax.entity';
import { TableEntity } from './table.entity';
import { PaymentEntity } from './payment.entity';
@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  totalAmount: number;

  @Column({
    type: 'enum',
    default: 'pending',
    enum: ['pending', 'paid', 'cancelled'],
  })
  status: 'pending' | 'paid' | 'cancelled';

  @Column()
  discount: number;

  @Column({ unique: true })
  orderCode: string;

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order)
  orderItems: OrderItemEntity[];

  @ManyToOne(() => UsersEntity, (user) => user.orders)
  @JoinColumn({ name: 'createdBy' })
  createdBy: UsersEntity;

  @ManyToOne(() => TaxEntity, (tax) => tax.orders)
  @JoinColumn({ name: 'tax' })
  tax: TaxEntity;

  @ManyToOne(() => TableEntity, (table) => table.orders)
  @JoinColumn({ name: 'tableId' })
  table: TableEntity;

  @OneToMany(() => PaymentEntity, (payment) => payment.order)
  payments: PaymentEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
