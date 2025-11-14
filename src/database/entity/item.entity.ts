import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItemEntity } from './order_item.entity';

@Entity('item')
export class ItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  category: string; // coffee, tea, dessert, topping,..

  @Column()
  price: number;

  @Column()
  amountLeft: number;

  @Column()
  description: string;

  @Column()
  status: string; // available, out of stock, discontinued

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.item)
  orderItems: OrderItemEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
