import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentEntity } from 'src/database/entity/payment.entity';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import * as QRCode from 'qrcode';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { OrderEntity } from 'src/database/entity/order.entity';
import { Payment } from './payment.domain';
import { PaymentMapper } from './payment.mapper';
import { UpdatePaymentDto } from './dto/update-payment.dto';
@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Step 1: Fetch order với relations
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.orderId },
      relations: ['payments'], // Load existing payments
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // Step 2: Validate order status
    if (order.status === 'paid') {
      throw new BadRequestException('Order is already paid');
    }
    if (order.status === 'cancelled') {
      throw new BadRequestException(
        'Cannot create payment for cancelled order',
      );
    }

    // Step 3: Prepare payment data
    let paymentData: Omit<
      Payment,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    > = {
      ...createPaymentDto,
      qrCode: null,
      amount: order.totalAmount,
      orderCode: order.orderCode,
    };

    // Step 4: Generate QR code nếu method là QR
    if (createPaymentDto.method === 'QR') {
      const baseURl = process.env.BASE_QRLINK;
      const addInfo = process.env.BASE_INFO + `${order.orderCode}`;
      const qrURL = new URL(baseURl);
      const amount = order.totalAmount;
      qrURL.searchParams.append('amount', amount.toString());
      qrURL.searchParams.append('addInfo', addInfo);
      paymentData.qrCode = await QRCode.toDataURL(qrURL.toString());
    }

    // Step 5: Create payment entity
    const paymentEntity = PaymentMapper.toEntity(paymentData as Payment);
    paymentEntity.order = order;

    // Step 6: Save payment
    const savedPayment = await this.paymentRepository.save(
      this.paymentRepository.create(paymentEntity),
    );

    // Step 7: Check if order should be marked as paid
    // Fetch all payments for this order
    const allPayments = await this.paymentRepository.find({
      where: { order: { id: order.id } },
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Update order status if fully paid
    if (totalPaid >= order.totalAmount) {
      order.status = 'paid';
      await this.orderRepository.save(order);
    }

    return PaymentMapper.toDomain(savedPayment);
  }

  async findAll(): Promise<Payment[]> {
    const payments = await this.paymentRepository.find();
    return payments.map((payment) => PaymentMapper.toDomain(payment));
  }

  async findById(id: Payment['id']): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    return PaymentMapper.toDomain(payment);
  }

  async update(
    id: Payment['id'],
    updateData: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }
    return PaymentMapper.toDomain(
      await this.paymentRepository.save({ ...payment, ...updateData }),
    );
  }

  async delete(id: Payment['id']): Promise<void> {
    await this.paymentRepository.softRemove({ id });
  }
  async processPaymentConfirmation(confirmPaymentDto: ConfirmPaymentDto) {
    // later implement
  }
}
