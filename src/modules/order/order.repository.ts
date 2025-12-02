import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from 'src/database/entity/order.entity';
import { UsersEntity } from 'src/database/entity/users.entity';
import { TaxEntity } from 'src/database/entity/tax.entity';
import { TableEntity } from 'src/database/entity/table.entity';
import { ItemEntity } from 'src/database/entity/item.entity';
import { OrderItemEntity } from 'src/database/entity/order_item.entity';
import { Order } from './order.domain';
import { OrderMapper } from './order.mapper';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
    @InjectRepository(TaxEntity)
    private taxRepository: Repository<TaxEntity>,
    @InjectRepository(TableEntity)
    private tableRepository: Repository<TableEntity>,
    @InjectRepository(ItemEntity)
    private itemRepository: Repository<ItemEntity>,
    @InjectRepository(OrderItemEntity)
    private orderItemRepository: Repository<OrderItemEntity>,
  ) {}

  async create(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Order> {
    // Step 1: Validate và fetch user
    const createdByUser = await this.usersRepository.findOne({
      where: { id: orderData.createdBy.id },
    });
    if (!createdByUser) {
      throw new BadRequestException('User not found');
    }

    // Step 2: Validate và fetch tax
    const tax = await this.taxRepository.findOne({
      where: { id: orderData.tax.id },
    });
    if (!tax) {
      throw new BadRequestException('Tax not found');
    }

    // Step 3: Validate và fetch table
    const table = await this.tableRepository.findOne({
      where: { id: orderData.table.id },
    });
    if (!table) {
      throw new BadRequestException('Table not found');
    }

    // Step 4: Validate items và tính subtotal
    if (!orderData.orderItems || orderData.orderItems.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    let subtotal = 0;
    const itemsToCreate: Array<{ item: ItemEntity; amount: number }> = [];

    for (const orderItemData of orderData.orderItems) {
      const item = await this.itemRepository.findOne({
        where: { id: orderItemData.item.id },
      });
      if (!item) {
        throw new BadRequestException(
          `Item with id ${orderItemData.item.id} not found`,
        );
      }

      // Validate amount
      if (orderItemData.amount <= 0) {
        throw new BadRequestException('Item amount must be greater than 0');
      }

      // Check stock availability
      if (item.amountLeft < orderItemData.amount) {
        throw new BadRequestException(
          `Item "${item.name}" has insufficient stock. Available: ${item.amountLeft}, requested: ${orderItemData.amount}`,
        );
      }

      // Calculate line total (quantity * unit price)
      const lineTotal = orderItemData.amount * item.price;
      subtotal += lineTotal;

      itemsToCreate.push({ item, amount: orderItemData.amount });
    }

    // Step 5: Calculate total amount
    // Formula: subtotal  * (1 + tax% - discount%)

    const totalAmount =
      subtotal * (1 + tax.percent / 100 - (orderData.discount || 0) / 100);

    // Step 6: Generate guaranteed unique order code
    // Use timestamp + random to avoid any race condition
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderCode = `ORD${timestamp}${random}`;

    // Step 7: Create order entity
    const orderEntity = this.orderRepository.create({
      orderCode: orderCode,
      totalAmount: Math.round(totalAmount), // Round to nearest integer
      discount: orderData.discount || 0,
      status: orderData.status || 'pending',
      createdBy: createdByUser,
      tax: tax,
      table: table,
    });

    // Step 8: Save order first to get ID
    const savedOrder = await this.orderRepository.save(orderEntity);

    // Step 9: Create order items with relationships
    const orderItems: OrderItemEntity[] = [];
    for (const { item, amount } of itemsToCreate) {
      const orderItem = this.orderItemRepository.create({
        amount: amount,
        item: item,
        order: savedOrder,
      });
      orderItems.push(orderItem);

      // Step 10: Update item stock
      item.amountLeft -= amount;
      await this.itemRepository.save(item);
    }
    await this.orderItemRepository.save(orderItems);

    // Step 11: Fetch complete order with all relationships
    const completeOrder = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: [
        'createdBy',
        'tax',
        'table',
        'orderItems',
        'orderItems.item',
        'payments',
      ],
    });

    return OrderMapper.toDomain(completeOrder);
  }

  async findAll(filters?: any): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: filters,
      relations: [
        'createdBy',
        'tax',
        'table',
        'orderItems',
        'orderItems.item',
        'payments',
      ],
    });
    return orders.map((order) => OrderMapper.toDomain(order));
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'createdBy',
        'tax',
        'table',
        'orderItems',
        'orderItems.item',
        'payments',
      ],
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    return OrderMapper.toDomain(order);
  }

  async update(
    id: string,
    updateData: Partial<
      Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Order> {
    const existingOrder = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItems'],
    });
    if (!existingOrder) {
      throw new BadRequestException('Order not found');
    }

    // Update basic fields
    if (updateData.totalAmount !== undefined) {
      existingOrder.totalAmount = updateData.totalAmount;
    }
    if (updateData.status !== undefined) {
      existingOrder.status = updateData.status;
    }
    if (updateData.discount !== undefined) {
      existingOrder.discount = updateData.discount;
    }

    // Update relationships if provided
    if (updateData.createdBy) {
      const user = await this.usersRepository.findOne({
        where: { id: updateData.createdBy.id },
      });
      if (user) existingOrder.createdBy = user;
    }

    if (updateData.tax) {
      const tax = await this.taxRepository.findOne({
        where: { id: updateData.tax.id },
      });
      if (tax) existingOrder.tax = tax;
    }

    if (updateData.table) {
      const table = await this.tableRepository.findOne({
        where: { id: updateData.table.id },
      });
      if (table) existingOrder.table = table;
    }

    await this.orderRepository.save(existingOrder);

    // Fetch updated order with all relationships
    const updatedOrder = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'createdBy',
        'tax',
        'table',
        'orderItems',
        'orderItems.item',
        'payments',
      ],
    });

    return OrderMapper.toDomain(updatedOrder);
  }

  async delete(id: string): Promise<void> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    const orderItems = await this.orderItemRepository.find({
      where: { order: { id: order.id } },
    });
    await this.orderItemRepository.softRemove(orderItems);
    await this.orderRepository.softRemove(order);
  }
}
