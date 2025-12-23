import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';
@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['cash', 'QR', 'card'] })
  method: string;

  @Column()
  amount: number;

  @Column({ nullable: true })
  qrCode: string;

  @Column({ nullable: true })
  qrCodePublicId: string;

  @Column({ nullable: true })
  orderCode: string;

  // Foreign key column - managed by the relation but exposed for queries
  @Column({ nullable: true, insert: false, update: false })
  orderId: string;

  @ManyToOne(() => OrderEntity, (order) => order.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updateAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
