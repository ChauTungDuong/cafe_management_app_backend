import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemEntity } from 'src/database/entity/item.entity';
import { Repository } from 'typeorm';
import { Item } from './item.domain';
import { ItemMapper } from './item.mapper';
import { CategoryEntity } from 'src/database/entity/category.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Injectable()
export class ItemRepository {
  constructor(
    @InjectRepository(ItemEntity)
    private itemRepository: Repository<ItemEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    itemData: Omit<
      Item,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'image'
    >,
    imageFile?: Express.Multer.File,
  ): Promise<Item> {
    const category = await this.categoryRepository.findOne({
      where: { name: itemData.category.name },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;

    if (imageFile) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        imageFile,
        'cf_items',
      );
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const entity = this.itemRepository.create({
      ...itemData,
      category: category,
      image: imageUrl,
      imagePublicId: imagePublicId,
    });
    const savedEntity = await this.itemRepository.save(entity);
    return ItemMapper.toDomain(savedEntity);
  }

  async findAll(filters: any): Promise<{ data: Item[]; total: number }> {
    const { skip, take, ...where } = filters || {};
    const [items, total] = await this.itemRepository.findAndCount({
      where,
      relations: ['category'],
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });

    return {
      data: items.map((item) => ItemMapper.toDomain(item)),
      total,
    };
  }

  async findById(id: Item['id']): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['category'], // Load category relation
    });
    if (!item) {
      throw new BadRequestException('Item not found');
    }
    return ItemMapper.toDomain(item);
  }

  async update(
    id: Item['id'],
    updateData: Partial<
      Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
    imageFile?: Express.Multer.File,
  ): Promise<Item> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new BadRequestException('Item not found');
    }
    // Xóa ảnh cũ trên Cloudinary nếu có publicId
    if (imageFile && item.imagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(item.imagePublicId);
      } catch (error) {
        throw new BadRequestException(
          'Failed to delete old image from Cloudinary',
        );
      }
    }

    // Upload ảnh mới
    if (imageFile) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        imageFile,
        'cf_items',
      );
      item.image = uploadResult.secure_url;
      item.imagePublicId = uploadResult.public_id;
    }

    await this.itemRepository.save({
      ...item,
      ...updateData,
      image: item.image,
      imagePublicId: item.imagePublicId,
    });
    return ItemMapper.toDomain(
      await this.itemRepository.findOne({ where: { id } }),
    );
  }

  async delete(id: Item['id']): Promise<void> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (item.imagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(item.imagePublicId);
      } catch (error) {
        throw new BadRequestException('Failed to delete image from Cloudinary');
      }
    }
    await this.itemRepository.softRemove({ id });
  }

  /**
   * Bulk create items từ array
   */
  async bulkCreate(
    itemsData: Array<
      Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'image'>
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
