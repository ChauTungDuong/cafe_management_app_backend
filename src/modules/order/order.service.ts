import { Injectable } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.domain';
import { ItemRepository } from '../item/item.repository';
import { QueryOrdersDto } from './dto/query-orders.dto';

@Injectable()
export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private itemRepository: ItemRepository,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    actor?: any,
  ): Promise<Order> {
    const orderData: Omit<
      Order,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    > = {
      createdBy: { id: createOrderDto.createdBy },
      taxesAndDiscounts: createOrderDto.taxDiscountIds?.map((id) => ({ id })),
      table: { id: createOrderDto.tableId },
      orderCode: '',
      totalAmount: 0,
      status: 'pending',
      payments: [],
      orderItems: createOrderDto.orderItems.map((item) => ({
        id: '',
        amount: item.amount,
        item: { id: item.itemId },
      })),
    };

    return this.orderRepository.create(orderData, actor);
  }

  async getAllOrders(filters?: QueryOrdersDto): Promise<Order[]> {
    return this.orderRepository.findAll(filters);
  }

  async getOrderById(id: string): Promise<Order> {
    return this.orderRepository.findById(id);
  }

  async updateOrder(id: string, updateData: Partial<Order>): Promise<Order> {
    return this.orderRepository.update(id, updateData);
  }

  async deleteOrder(id: string): Promise<void> {
    return this.orderRepository.delete(id);
  }
}
