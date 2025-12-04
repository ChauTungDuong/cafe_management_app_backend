import { Injectable } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemRepository } from './item.repository';
import { UpdateItemDto } from './dto/update-item.dto';
import { BulkCreateItemDto } from './dto/bulk-create-item.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ItemService {
  constructor(private itemRepository: ItemRepository) {}

  createItem(createItemDto: CreateItemDto, image: Express.Multer.File) {
    return this.itemRepository.create(createItemDto, image);
  }

  /**
   * Bulk create items từ JSON array
   */
  async bulkCreateItems(bulkCreateItemDto: BulkCreateItemDto) {
    return await this.itemRepository.bulkCreate(bulkCreateItemDto.items);
  }

  getAllItems(filtersDto: any) {
    return this.itemRepository.findAll(filtersDto);
  }

  getItemById(id: string) {
    return this.itemRepository.findById(id);
  }

  updateItem(
    id: string,
    updateItemDto: UpdateItemDto,
    file: Express.Multer.File,
  ) {
    return this.itemRepository.update(id, updateItemDto, file);
  }

  deleteItem(id: string) {
    return this.itemRepository.delete(id);
  }
}
