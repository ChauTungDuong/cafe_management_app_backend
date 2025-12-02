import { Module } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from 'src/database/entity/payment.entity';
import { PaymentController } from './payment.controller';
import { OrderEntity } from 'src/database/entity/order.entity';
import { PaymentService } from './payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity, OrderEntity])],
  controllers: [PaymentController],
  providers: [PaymentRepository, PaymentService],
  exports: [PaymentRepository],
})
export class PaymentModule {}
