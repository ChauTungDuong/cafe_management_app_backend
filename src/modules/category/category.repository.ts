import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoryEntity } from 'src/database/entity/category.entity';
import { Repository } from 'typeorm';
import { Category } from './category.domain';
import { CategoryMapper } from './category.mapper';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateCategoryDto } from './dto/update-category.dto';
@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const entity = await this.categoryRepository.save(
      this.categoryRepository.create({
        name: createCategoryDto.name,
      }),
    );
    return CategoryMapper.toDomain(entity);
  }

  async findAll(): Promise<{ data: Category[]; total: number }> {
    const [categories, total] = await this.categoryRepository.findAndCount();

    return {
      data: categories.map((category) => CategoryMapper.toDomain(category)),
      total,
    };
  }

  async findById(id: Category['id']): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    return CategoryMapper.toDomain(category);
  }
  async update(
    id: Category['id'],
    updateData: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
    return CategoryMapper.toDomain(
      await this.categoryRepository.save({ ...category, ...updateData }),
    );
  }
  async delete(id: Category['id']): Promise<void> {
    await this.categoryRepository.softRemove({ id });
  }
}
