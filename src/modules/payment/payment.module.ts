import { Module } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from 'src/database/entity/payment.entity';
import { PaymentController } from './payment.controller';
import { OrderEntity } from 'src/database/entity/order.entity';
import { PaymentService } from './payment.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, OrderEntity]),
    CloudinaryModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentRepository, PaymentService],
  exports: [PaymentRepository],
})
export class PaymentModule {}
