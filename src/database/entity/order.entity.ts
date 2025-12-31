import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItemEntity } from './order_item.entity';
import { UsersEntity } from './users.entity';
import { TaxAndDiscountEntity } from './tax-and-discount.entity';
import { TableEntity } from './table.entity';
import { PaymentEntity } from './payment.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ingredientCost: number;

  @Column({
    type: 'enum',
    default: 'pending',
    enum: ['pending', 'paid', 'cancelled'],
  })
  status: 'pending' | 'paid' | 'cancelled';

  @Column({ unique: true })
  orderCode: string;

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order)
  orderItems: OrderItemEntity[];

  @ManyToOne(() => UsersEntity, (user) => user.orders)
  @JoinColumn({ name: 'createdBy' })
  createdBy: UsersEntity;

  @ManyToMany(() => TaxAndDiscountEntity, (taxDiscount) => taxDiscount.orders, {
    cascade: true,
  })
  @JoinTable({
    name: 'order_tax_discount',
    joinColumn: { name: 'orderId', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'taxDiscountId',
      referencedColumnName: 'id',
    },
  })
  taxesAndDiscounts: TaxAndDiscountEntity[];

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
