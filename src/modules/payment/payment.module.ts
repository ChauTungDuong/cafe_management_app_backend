import { Module } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from 'src/database/entity/payment.entity';
import { PaymentController } from './payment.controller';
import { OrderEntity } from 'src/database/entity/order.entity';
import { PaymentService } from './payment.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { WebhookEntity } from 'src/database/entity/webhook.entity';
import { PaymentGateway } from './payment.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, OrderEntity, WebhookEntity]),
    CloudinaryModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentRepository, PaymentService, PaymentGateway],
  exports: [PaymentRepository, PaymentGateway],
})
export class PaymentModule {}
