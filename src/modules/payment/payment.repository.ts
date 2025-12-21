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
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as crc from 'crc';
import { WebhookEntity } from 'src/database/entity/webhook.entity';
import { PaymentGateway } from './payment.gateway';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
    @InjectRepository(WebhookEntity)
    private webhookRepository: Repository<WebhookEntity>,
    private cloudinaryService: CloudinaryService,
    private paymentGateway: PaymentGateway,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.orderId },
      relations: ['payments'],
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status === 'paid') {
      throw new BadRequestException('Order is already paid');
    }
    if (order.status === 'cancelled') {
      throw new BadRequestException(
        'Cannot create payment for cancelled order',
      );
    }

    let paymentData: Omit<
      Payment,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    > = {
      ...createPaymentDto,
      qrCode: null,
      qrCodePublicId: null,
      amount: order.totalAmount,
      orderCode: order.orderCode,
    };

    if (createPaymentDto.method === 'QR') {
      const bankBin = process.env.BANK_BIN;
      const virtualAccount = process.env.VIRTUAL_ACCOUNT; // Tài khoản ảo từ SePay
      const amount = order.totalAmount;
      const description = `${process.env.BASE_INFO || 'KAFEIN'}${order.orderCode}`;

      const qrString = this.generateVietQRString(
        bankBin,
        virtualAccount,
        amount,
        description,
      );

      const qrBuffer = await QRCode.toBuffer(qrString, {
        type: 'png',
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      const uploadResult = await this.cloudinaryService.uploadImage(
        {
          buffer: qrBuffer,
          mimetype: 'image/png',
          originalname: `qr-${order.orderCode}.png`,
          size: qrBuffer.length,
        } as Express.Multer.File,
        'cafe_payments_qr_codes',
      );

      paymentData.qrCode = uploadResult.secure_url;
      paymentData.qrCodePublicId = uploadResult.public_id;
    }

    const paymentEntity = this.paymentRepository.create({
      method: paymentData.method,
      amount: paymentData.amount,
      qrCode: paymentData.qrCode,
      qrCodePublicId: paymentData.qrCodePublicId,
      orderCode: paymentData.orderCode,
      orderId: order.id, // Explicitly set the foreign key
    });

    const savedPayment = await this.paymentRepository.save(paymentEntity);

    console.log('✅ Payment saved:', savedPayment.id, 'for order:', order.id);

    if (paymentData.method !== 'QR') {
      // Query all payments for this order to check if fully paid
      const allPayments = await this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.order = :orderId', { orderId: order.id })
        .getMany();

      const totalPaid = allPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      if (totalPaid >= order.totalAmount) {
        order.status = 'paid';
        await this.orderRepository.save(order);
      }
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
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.qrCodePublicId) {
      try {
        await this.cloudinaryService.deleteImage(payment.qrCodePublicId);
      } catch (error) {
        console.warn('Failed to delete QR code from Cloudinary:', error);
      }
    }

    if (payment.order) {
      payment.order.status = 'pending';
      await this.orderRepository.save(payment.order);
    }

    await this.paymentRepository.softRemove(payment);
  }

  async findByOrderCode(orderCode: string): Promise<Payment | null> {
    const payment = await this.paymentRepository.findOne({
      where: { orderCode },
    });
    return payment ? PaymentMapper.toDomain(payment) : null;
  }

  async checkPaymentStatus(orderCode: string): Promise<{
    orderCode: string;
    orderStatus: string;
    isPaid: boolean;
    payment: Payment | null;
  }> {
    const order = await this.orderRepository.findOne({
      where: { orderCode },
    });

    if (!order) {
      throw new BadRequestException(`Order not found: ${orderCode}`);
    }

    const payment = await this.findByOrderCode(orderCode);

    return {
      orderCode: order.orderCode,
      orderStatus: order.status,
      isPaid: order.status === 'paid',
      payment: payment,
    };
  }

  private generateVietQRString(
    bankBin: string,
    virtualAccount: string,
    amount: number,
    description: string,
  ): string {
    const payloadFormatIndicator = '000201';
    const pointOfInitiation = '010212';

    // Tag 38: Merchant Account Information
    const guid = 'A000000727'; // VietQR GUID
    const guidField = `0010${guid}`; // Tag 00, Length 10

    // Tag 01: Beneficiary Organization
    // - Tag 00: Bank BIN (6 digits)
    // - Tag 01: Virtual Account Number
    const bankBinField = `0006${bankBin}`;
    const accountField = `01${String(virtualAccount.length).padStart(2, '0')}${virtualAccount}`;
    const beneficiaryValue = `${bankBinField}${accountField}`;
    const beneficiaryField = `01${String(beneficiaryValue.length).padStart(2, '0')}${beneficiaryValue}`;

    // Tag 02: Service Code
    const serviceCode = '0208QRIBFTTA';

    // Combine all fields for Tag 38
    const merchantAccountValue = `${guidField}${beneficiaryField}${serviceCode}`;
    const merchantAccount = `38${String(merchantAccountValue.length).padStart(2, '0')}${merchantAccountValue}`;

    // Transaction Currency (VND = 704)
    const currency = '5303704';

    // Transaction Amount
    const amountStr = amount.toString();
    const transactionAmount = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;

    // Country Code
    const countryCode = '5802VN';

    // Additional Data Field (Tag 62)
    const purposeOfTransaction = `08${String(description.length).padStart(2, '0')}${description}`;
    const additionalData = `62${String(purposeOfTransaction.length).padStart(2, '0')}${purposeOfTransaction}`;

    // Build QR string without CRC
    const qrStringWithoutCRC =
      payloadFormatIndicator +
      pointOfInitiation +
      merchantAccount +
      currency +
      transactionAmount +
      countryCode +
      additionalData +
      '6304'; // CRC placeholder

    // Calculate CRC16-CCITT
    const crcValue = crc
      .crc16ccitt(qrStringWithoutCRC)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');

    // Final QR string
    const finalQR = qrStringWithoutCRC + crcValue;
    return finalQR;
  }

  async processPaymentConfirmation(paymentHook: ConfirmPaymentDto) {
    console.log('📥 Webhook received:', JSON.stringify(paymentHook));

    const orderCode = this.extractOrderCode(paymentHook.content);

    const webhook = this.webhookRepository.create({
      webhookId: paymentHook.id?.toString() || paymentHook.referenceCode,
      orderCode: orderCode,
      rawData: paymentHook,
      processed: false,
    });
    const savedWebhook = await this.webhookRepository.save(webhook);

    try {
      if (paymentHook.transferType !== 'in') {
        throw new BadRequestException('Transfer type is not "in"');
      }

      if (paymentHook.subAccount !== process.env.VIRTUAL_ACCOUNT) {
        console.log(' Virtual account mismatch');
        throw new BadRequestException('Virtual account does not match');
      }

      if (!orderCode) {
        console.log(
          ' Cannot extract order code from content:',
          paymentHook.content,
        );
        throw new BadRequestException('Cannot extract order code from content');
      }
      console.log('Extracted order code:', orderCode);

      const payment = await this.findByOrderCode(orderCode);
      if (!payment) {
        throw new BadRequestException(
          `Payment not found for order: ${orderCode}`,
        );
      }

      if (paymentHook.transferAmount < payment.amount) {
        throw new BadRequestException(
          `Amount mismatch. Expected: ${payment.amount}, Received: ${paymentHook.transferAmount}`,
        );
      }

      const order = await this.orderRepository.findOne({
        where: { orderCode: payment.orderCode },
      });
      if (!order) {
        throw new BadRequestException(`Order not found: ${payment.orderCode}`);
      }

      order.status = 'paid';
      await this.orderRepository.save(order);

      await this.markWebhookProcessed(savedWebhook.id, true);

      this.paymentGateway.notifyPaymentSuccess(orderCode, {
        amount: paymentHook.transferAmount,
        transactionDate: paymentHook.transactionDate,
        referenceCode: paymentHook.referenceCode,
      });

      return {
        success: true,
        orderCode: orderCode,
        amount: paymentHook.transferAmount,
        message: 'Payment confirmed successfully',
      };
    } catch (error) {
      await this.markWebhookProcessed(savedWebhook.id, false, error.message);

      if (orderCode) {
        this.paymentGateway.notifyPaymentFailed(orderCode, error.message);
      }

      throw error;
    }
  }

  private async markWebhookProcessed(
    webhookId: number,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    await this.webhookRepository.update(webhookId, {
      processed: success,
      processedAt: new Date(),
      errorMessage: errorMessage || null,
    });
  }

  private extractOrderCode(content: string): string | null {
    if (!content) return null;

    const start = content.indexOf('ORD');
    const orderCode = content.substring(start, start + 15);
    return orderCode || null;
  }
}
