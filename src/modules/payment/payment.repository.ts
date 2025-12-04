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
@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
    private cloudinaryService: CloudinaryService,
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
      const accountNumber = process.env.BANK_ACCOUNT;
      const amount = order.totalAmount;
      const description = `${process.env.BASE_INFO || 'KAFEIN'}${order.orderCode}`;

      const qrString = this.generateVietQRString(
        bankBin,
        accountNumber,
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

    // Sử dụng mapper để tạo entity từ domain data
    const paymentEntity = PaymentMapper.toEntity(paymentData as Payment);

    // Gán order relationship (mapper không làm điều này)
    paymentEntity.order = order;

    const savedPayment = await this.paymentRepository.save(paymentEntity);

    const allPayments = await this.paymentRepository.find({
      where: { order: { id: order.id } },
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

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
    await this.paymentRepository.softRemove({ id });
  }

  async findByOrderCode(orderCode: string): Promise<Payment | null> {
    const payment = await this.paymentRepository.findOne({
      where: { orderCode },
    });
    return payment ? PaymentMapper.toDomain(payment) : null;
  }

  private generateVietQRString(
    bankBin: string,
    accountNumber: string,
    amount: number,
    description: string,
  ): string {
    const payloadFormatIndicator = '000201';
    const pointOfInitiation = '010212';

    // Tag 38: Merchant Account Information
    const guid = 'A000000727'; // VietQR GUID
    const guidField = `0010${guid}`; // Tag 00, Length 10

    // Tag 01: Beneficiary Organization = Bank BIN (Tag 00) + Account Number (Tag 01)
    const bankBinField = `0006${bankBin}`;
    const accountField = `01${String(accountNumber.length).padStart(2, '0')}${accountNumber}`;
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

  async processPaymentConfirmation(confirmPaymentDto: ConfirmPaymentDto) {
    // later implement
  }
}
