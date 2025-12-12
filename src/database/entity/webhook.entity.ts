import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('webhooks')
export class WebhookEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  webhookId: string;

  @Column({ nullable: true })
  orderCode: string;

  @Column({ type: 'jsonb', nullable: true })
  rawData: Record<string, any>;

  @Column({ default: false })
  processed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
