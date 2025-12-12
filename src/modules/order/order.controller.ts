import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  getAllOrders(@Query() filters?: any) {
    return this.orderService.getAllOrders(filters);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id')
  updateOrder(@Param('id') id: string, @Body() updateData: any) {
    return this.orderService.updateOrder(id, updateData);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }
}
