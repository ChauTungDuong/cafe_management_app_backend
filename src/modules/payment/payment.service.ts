import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  createPayment(createPaymentDto: CreatePaymentDto) {
    return this.paymentRepository.create(createPaymentDto);
  }

  getAllPayments() {
    return this.paymentRepository.findAll();
  }
  getPaymentById(id: string) {
    return this.paymentRepository.findById(id);
  }
  updatePayment(id: string, updatePaymentDto: UpdatePaymentDto) {
    return this.paymentRepository.update(id, updatePaymentDto);
  }
  deletePayment(id: string) {
    return this.paymentRepository.delete(id);
  }

  checkPaymentStatus(orderCode: string) {
    return this.paymentRepository.checkPaymentStatus(orderCode);
  }

  handlePaymentHook(confirmPaymentDto: ConfirmPaymentDto) {
    return this.paymentRepository.processPaymentConfirmation(confirmPaymentDto);
  }
}
