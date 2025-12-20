import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { Item } from 'src/modules/item/item.domain';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  items?: Partial<Item>[];
}
