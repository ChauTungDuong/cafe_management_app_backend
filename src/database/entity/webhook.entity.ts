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
  webhookId: string; // ID hoặc referenceCode từ SePay

  @Column({ nullable: true })
  orderCode: string; // Extracted order code

  @Column({ type: 'jsonb', nullable: true })
  rawData: Record<string, any>; // Toàn bộ payload từ webhook

  @Column({ default: false })
  processed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
