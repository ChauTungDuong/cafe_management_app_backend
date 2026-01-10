import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { QueryOrdersDto } from './dto/query-orders.dto';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    return this.orderService.createOrder(createOrderDto, req.user as any);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  getAllOrders(@Query() filters: QueryOrdersDto) {
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
