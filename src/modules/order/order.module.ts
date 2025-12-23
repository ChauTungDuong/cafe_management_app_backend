import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from 'src/database/entity/order.entity';
import { UsersEntity } from 'src/database/entity/users.entity';
import { TaxAndDiscountEntity } from 'src/database/entity/tax-and-discount.entity';
import { TableEntity } from 'src/database/entity/table.entity';
import { ItemEntity } from 'src/database/entity/item.entity';
import { OrderItemEntity } from 'src/database/entity/order_item.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { ItemRepository } from '../item/item.repository';
import { CategoryEntity } from 'src/database/entity/category.entity';
import { CategoryRepository } from '../category/category.repository';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { IngredientEntity } from 'src/database/entity/ingredient.entity';
import { RecipeEntity } from 'src/database/entity/recipe.entity';
import { PaymentEntity } from 'src/database/entity/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      UsersEntity,
      TaxAndDiscountEntity,
      TableEntity,
      ItemEntity,
      OrderItemEntity,
      CategoryEntity,
      IngredientEntity,
      RecipeEntity,
      PaymentEntity,
    ]),
    CloudinaryModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    ItemRepository,
    CategoryRepository,
  ],
  exports: [OrderRepository],
})
export class OrderModule {}
