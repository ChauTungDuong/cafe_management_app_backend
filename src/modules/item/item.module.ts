import { Module } from '@nestjs/common';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { ItemRepository } from './item.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemEntity } from 'src/database/entity/item.entity';
import { CategoryEntity } from 'src/database/entity/category.entity';
import { CategoryModule } from '../category/category.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemEntity, CategoryEntity]),
    CategoryModule,
    CloudinaryModule,
  ],
  controllers: [ItemController],
  providers: [ItemService, ItemRepository],
  exports: [],
})
export class ItemModule {}
