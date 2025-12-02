import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemEntity } from 'src/database/entity/item.entity';
import { Repository } from 'typeorm';
import { Item } from './item.domain';
import { ItemMapper } from './item.mapper';
import { CategoryEntity } from 'src/database/entity/category.entity';
@Injectable()
export class ItemRepository {
  constructor(
    @InjectRepository(ItemEntity)
    private itemRepository: Repository<ItemEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(
    itemData: Omit<
      Item,
      'id' | 'orderItems' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
  ): Promise<Item> {
    const category = await this.categoryRepository.findOne({
      where: { name: itemData.category.name.toLowerCase() },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
    const entity = this.itemRepository.create({
      ...itemData,
      category: category,
    });
    const savedEntity = await this.itemRepository.save(entity);
    return ItemMapper.toDomain(savedEntity);
  }

  async findAll(filters: any): Promise<Item[]> {
    const items = await this.itemRepository.find({
      where: filters,
    });
    return items.map((item) => ItemMapper.toDomain(item));
  }

  async findById(id: Item['id']): Promise<Item> {
    const item = await this.itemRepository.findOne({ where: { id } });
    return ItemMapper.toDomain(item);
  }

  async update(
    id: Item['id'],
    updateData: Partial<
      Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Item> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new Error('Item not found');
    }
    await this.itemRepository.save({ ...item, ...updateData });
    return ItemMapper.toDomain(
      await this.itemRepository.findOne({ where: { id } }),
    );
  }

  async delete(id: Item['id']): Promise<void> {
    await this.itemRepository.softRemove({ id });
  }

  /**
   * Bulk create items từ array
   */
  async bulkCreate(
    itemsData: Array<
      Omit<Item, 'id' | 'orderItems' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<{
    success: Item[];
    failed: Array<{ item: any; error: string }>;
  }> {
    const success: Item[] = [];
    const failed: Array<{ item: any; error: string }> = [];

    // Process từng item
    for (const itemData of itemsData) {
      try {
        // Tìm hoặc tạo category
        let category = await this.categoryRepository.findOne({
          where: { name: itemData.category.name.toLowerCase() },
        });

        if (!category) {
          // Auto-create category nếu chưa tồn tại
          category = this.categoryRepository.create({
            name: itemData.category.name.toLowerCase(),
          });
          category = await this.categoryRepository.save(category);
        }

        // Tạo item entity
        const entity = this.itemRepository.create({
          ...itemData,
          category: category,
        });

        const savedEntity = await this.itemRepository.save(entity);
        success.push(ItemMapper.toDomain(savedEntity));
      } catch (error) {
        failed.push({
          item: itemData,
          error: error.message || 'Unknown error',
        });
      }
    }

    return { success, failed };
  }
}
