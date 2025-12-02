import { Injectable } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}
  createCategory(createCategoryDto: CreateCategoryDto) {
    return this.categoryRepository.create(createCategoryDto);
  }

  getAllCategories() {
    return this.categoryRepository.findAll();
  }

  getCategoryById(id: string) {
    return this.categoryRepository.findById(id);
  }

  updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.categoryRepository.update(id, updateCategoryDto);
  }
  deleteCategory(id: string) {
    return this.categoryRepository.delete(id);
  }
}
