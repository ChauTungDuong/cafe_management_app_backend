import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from 'src/database/entity/order.entity';
import { UsersEntity } from 'src/database/entity/users.entity';
import { TaxAndDiscountEntity } from 'src/database/entity/tax-and-discount.entity';
import { TableEntity } from 'src/database/entity/table.entity';
import { ItemEntity } from 'src/database/entity/item.entity';
import { OrderItemEntity } from 'src/database/entity/order_item.entity';
import { Order } from './order.domain';
import { OrderMapper } from './order.mapper';
import { IngredientEntity } from 'src/database/entity/ingredient.entity';
import { RecipeEntity } from 'src/database/entity/recipe.entity';
import { PaymentEntity } from 'src/database/entity/payment.entity';
import { LogEntity, Action } from 'src/database/entity/log.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
    @InjectRepository(TaxAndDiscountEntity)
    private taxDiscountRepository: Repository<TaxAndDiscountEntity>,
    @InjectRepository(TableEntity)
    private tableRepository: Repository<TableEntity>,
    @InjectRepository(ItemEntity)
    private itemRepository: Repository<ItemEntity>,
    @InjectRepository(OrderItemEntity)
    private orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(IngredientEntity)
    private ingredientRepository: Repository<IngredientEntity>,
    @InjectRepository(RecipeEntity)
    private recipeRepository: Repository<RecipeEntity>,
  ) {}

  async create(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
    actor?: { id?: string; name?: string; role?: any },
  ): Promise<Order> {
    const createdByUser = await this.usersRepository.findOne({
      where: { id: orderData.createdBy.id },
    });
    if (!createdByUser) {
      throw new BadRequestException('User not found');
    }

    let taxesAndDiscounts: TaxAndDiscountEntity[] = [];
    if (orderData.taxesAndDiscounts && orderData.taxesAndDiscounts.length > 0) {
      const ids = orderData.taxesAndDiscounts.map((td) => td.id);
      taxesAndDiscounts = await this.taxDiscountRepository.findByIds(ids);
      if (taxesAndDiscounts.length !== ids.length) {
        throw new BadRequestException('One or more tax/discount not found');
      }
    }

    const table = await this.tableRepository.findOne({
      where: { id: orderData.table.id },
    });
    if (!table) {
      throw new BadRequestException('Table not found');
    }

    if (!orderData.orderItems || orderData.orderItems.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // use transaction and manager
    const result = await this.orderRepository.manager.transaction(
      async (manager) => {
        let subtotal = 0;
        let ingredientCost = 0;
        const itemsToCreate: Array<{ item: ItemEntity; amount: number }> = [];

        for (const orderItemData of orderData.orderItems) {
          const item = await manager.getRepository(ItemEntity).findOne({
            where: { id: orderItemData.item.id },
            relations: [
              'recipes',
              'recipes.recipeIngredients',
              'recipes.recipeIngredients.ingredient',
            ],
          });
          if (!item) {
            throw new BadRequestException(
              `Item with id ${orderItemData.item.id} not found`,
            );
          }

          const itemRecipes = item.recipes;
          if (itemRecipes && itemRecipes.length > 0) {
            for (const recipe of itemRecipes) {
              if (
                recipe.recipeIngredients &&
                recipe.recipeIngredients.length > 0
              ) {
                for (const recipeIngredient of recipe.recipeIngredients) {
                  const ingredient = recipeIngredient.ingredient;
                  const required =
                    recipeIngredient.amount * orderItemData.amount;
                  if (ingredient.amountLeft < required) {
                    throw new BadRequestException(
                      `Not enough ingredient ${ingredient.name} for item ${item.name}`,
                    );
                  }

                  const unitCost = Number(
                    (ingredient as any).pricePerUnit?.price,
                  );
                  if (!Number.isFinite(unitCost)) {
                    throw new BadRequestException(
                      `Missing/invalid pricePerUnit for ingredient ${ingredient.name}`,
                    );
                  }
                  ingredientCost += Number(required) * unitCost;

                  // decrement and save via transactional manager
                  ingredient.amountLeft =
                    Number(ingredient.amountLeft) - Number(required);
                  await manager
                    .getRepository(IngredientEntity)
                    .save(ingredient);
                }
              }
            }
          }

          if (orderItemData.amount <= 0) {
            throw new BadRequestException('Item amount must be greater than 0');
          }

          const lineTotal = orderItemData.amount * item.price;
          subtotal += lineTotal;

          // also persist potential item stock changes
          await manager.getRepository(ItemEntity).save(item);

          itemsToCreate.push({ item, amount: orderItemData.amount });
        }

        // Calculate total with taxes and discounts
        let totalAmount = subtotal;

        // Apply taxes and discounts based on type
        if (taxesAndDiscounts.length > 0) {
          for (const taxDiscount of taxesAndDiscounts) {
            const adjustment = (subtotal * taxDiscount.percent) / 100;
            if (taxDiscount.type === 'tax') {
              // Tax: add to subtotal
              totalAmount += adjustment;
            } else if (taxDiscount.type === 'discount') {
              // Discount: subtract from subtotal
              totalAmount -= adjustment;
            }
          }
        }

        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderCode = `ORD${timestamp}${random}`;

        const orderEntity = manager.getRepository(OrderEntity).create({
          orderCode: orderCode,
          totalAmount: Math.round(totalAmount),
          ingredientCost: Number(ingredientCost.toFixed(2)),
          status: orderData.status || 'pending',
          createdBy: await manager
            .getRepository(UsersEntity)
            .findOne({ where: { id: orderData.createdBy.id } }),
          taxesAndDiscounts: taxesAndDiscounts,
          table: await manager
            .getRepository(TableEntity)
            .findOne({ where: { id: orderData.table.id } }),
        });

        const savedOrder = await manager
          .getRepository(OrderEntity)
          .save(orderEntity);

        // Audit log: order created
        if (actor?.id) {
          await manager.getRepository(LogEntity).save(
            manager.getRepository(LogEntity).create({
              userId: actor.id,
              userName: actor.name,
              userRole: actor.role,
              action: Action.CREATE,
              entityType: 'order',
              entityId: savedOrder.id,
              entityName: orderCode,
              message: `${actor.name ?? actor.id} tạo hóa đơn id: ${savedOrder.id}`,
              metadata: {
                orderCode,
                totalAmount: Math.round(totalAmount),
                ingredientCost: Number(ingredientCost.toFixed(2)),
                tableId: orderData.table?.id,
              },
            }),
          );
        }

        const orderItems: OrderItemEntity[] = [];
        for (const { item, amount } of itemsToCreate) {
          const orderItem = manager.getRepository(OrderItemEntity).create({
            amount: amount,
            item: item,
            order: savedOrder,
          });
          orderItems.push(orderItem);
        }
        await manager.getRepository(OrderItemEntity).save(orderItems);

        return savedOrder;
      },
    );

    // After transaction completes, fetch the complete order with relations
    const completeOrder = await this.orderRepository.findOne({
      where: { id: result.id },
      relations: [
        'createdBy',
        'taxesAndDiscounts',
        'table',
        'orderItems',
        'orderItems.item',
        'payments',
      ],
    });

    return OrderMapper.toDomain(completeOrder);
  }

  async findAll(filters?: any): Promise<Order[]> {
    // Fetch orders first; payments are loaded in a second query by orderId.
    let queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.createdBy', 'createdBy')
      .leftJoinAndSelect('order.taxesAndDiscounts', 'taxesAndDiscounts')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.item', 'item')
      .orderBy('order.createdAt', 'DESC');

    // Apply filters if provided
    if (filters?.status) {
      queryBuilder = queryBuilder.where('order.status = :status', {
        status: filters.status,
      });
    }

    const orders = await queryBuilder.getMany();

    // Hydrate payments by FK. This avoids inconsistent relation-join behavior observed for cash/card.
    const orderIds = orders.map((o) => o.id).filter(Boolean);
    if (orderIds.length > 0) {
      const payments = await this.orderRepository.manager
        .getRepository(PaymentEntity)
        .createQueryBuilder('payment')
        .where('payment.orderId IN (:...orderIds)', { orderIds })
        .andWhere('payment.deletedAt IS NULL')
        .orderBy('payment.createdAt', 'ASC')
        .getMany();

      const paymentsByOrderId = new Map<string, PaymentEntity[]>();
      for (const p of payments) {
        const oid = (p as any).orderId;
        if (!oid) continue;
        const arr = paymentsByOrderId.get(oid) ?? [];
        arr.push(p);
        paymentsByOrderId.set(oid, arr);
      }

      for (const o of orders) {
        (o as any).payments = paymentsByOrderId.get(o.id) ?? [];
      }
    }

    return orders.map((order) => OrderMapper.toDomain(order));
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'createdBy',
        'taxesAndDiscounts',
        'table',
        'orderItems',
        'orderItems.item',
      ],
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const payments = await this.orderRepository.manager
      .getRepository(PaymentEntity)
      .createQueryBuilder('payment')
      .where('payment.orderId = :orderId', { orderId: id })
      .andWhere('payment.deletedAt IS NULL')
      .orderBy('payment.createdAt', 'ASC')
      .getMany();
    (order as any).payments = payments;

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

    if (updateData.totalAmount !== undefined) {
      existingOrder.totalAmount = updateData.totalAmount;
    }
    if (updateData.status !== undefined) {
      existingOrder.status = updateData.status;
    }

    if (updateData.createdBy) {
      const user = await this.usersRepository.findOne({
        where: { id: updateData.createdBy.id },
      });
      if (user) existingOrder.createdBy = user;
    }

    if (updateData.taxesAndDiscounts) {
      const ids = updateData.taxesAndDiscounts.map((td) => td.id);
      const taxesAndDiscounts = await this.taxDiscountRepository.findByIds(ids);
      if (taxesAndDiscounts.length === ids.length) {
        existingOrder.taxesAndDiscounts = taxesAndDiscounts;
      }
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
        'taxesAndDiscounts',
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
