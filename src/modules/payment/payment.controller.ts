import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotAcceptableException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Public, Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}
  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  getAllPayments() {
    return this.paymentService.getAllPayments();
  }
  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  getPaymentById(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentService.updatePayment(id, updatePaymentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  deletePayment(@Param('id') id: string) {
    return this.paymentService.deletePayment(id);
  }

  // Check payment status by orderCode (for polling)
  @Get('status/:orderCode')
  @Roles(Role.ADMIN, Role.STAFF)
  checkPaymentStatus(@Param('orderCode') orderCode: string) {
    return this.paymentService.checkPaymentStatus(orderCode);
  }

  // Webhook from SePay
  @Public()
  @Post('hook')
  async paymentHook(@Body() confirmPaymentDto: ConfirmPaymentDto) {
    try {
      const result =
        await this.paymentService.handlePaymentHook(confirmPaymentDto);
      return {
        success: true,
        message: 'Payment confirmed successfully',
        data: result,
      };
    } catch (error) {
      throw new NotAcceptableException('Payment confirmation failed');
    }
  }
}
