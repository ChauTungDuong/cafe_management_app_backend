import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { OrderItemEntity } from './order_item.entity';
import { CategoryEntity } from './category.entity';

@Entity('item')
export class ItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  price: number;

  @Column()
  amountLeft: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  imagePublicId?: string;

  @Column({
    type: 'enum',
    default: 'available',
    enum: ['available', 'out of stock', 'discontinued'],
  })
  status: string;

  @ManyToOne(() => CategoryEntity, (category) => category.items)
  category: CategoryEntity;

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.item)
  orderItems: OrderItemEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
