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
import { IngredientEntity } from 'src/database/entity/ingredient.entity';
import { RecipeEntity } from 'src/database/entity/recipe.entity';

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
    @InjectRepository(IngredientEntity)
    private ingredientRepository: Repository<IngredientEntity>,
    @InjectRepository(RecipeEntity)
    private recipeRepository: Repository<RecipeEntity>,
  ) {}

  async create(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Order> {
    const createdByUser = await this.usersRepository.findOne({
      where: { id: orderData.createdBy.id },
    });
    if (!createdByUser) {
      throw new BadRequestException('User not found');
    }

    const tax = await this.taxRepository.findOne({
      where: { id: orderData.tax.id },
    });
    if (!tax) {
      throw new BadRequestException('Tax not found');
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

        const totalAmount =
          subtotal *
          (1 +
            (
              await manager
                .getRepository(TaxEntity)
                .findOne({ where: { id: orderData.tax.id } })
            ).percent /
              100 -
            (orderData.discount || 0) / 100);

        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderCode = `ORD${timestamp}${random}`;

        const orderEntity = manager.getRepository(OrderEntity).create({
          orderCode: orderCode,
          totalAmount: Math.round(totalAmount),
          discount: orderData.discount || 0,
          status: orderData.status || 'pending',
          createdBy: await manager
            .getRepository(UsersEntity)
            .findOne({ where: { id: orderData.createdBy.id } }),
          tax: await manager
            .getRepository(TaxEntity)
            .findOne({ where: { id: orderData.tax.id } }),
          table: await manager
            .getRepository(TableEntity)
            .findOne({ where: { id: orderData.table.id } }),
        });

        const savedOrder = await manager
          .getRepository(OrderEntity)
          .save(orderEntity);

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

    if (updateData.totalAmount !== undefined) {
      existingOrder.totalAmount = updateData.totalAmount;
    }
    if (updateData.status !== undefined) {
      existingOrder.status = updateData.status;
    }
    if (updateData.discount !== undefined) {
      existingOrder.discount = updateData.discount;
    }

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
