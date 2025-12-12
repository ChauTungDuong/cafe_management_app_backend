import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RecipeIngredientsEntity } from 'src/database/entity/recipe_ingredients.entity';
import { Repository } from 'typeorm';
import { CreateRecipeIngredientsDto } from './create-rep-ing.dto';
@Injectable()
export class RecipeIngredientsRepository {
  constructor(
    @InjectRepository(RecipeIngredientsEntity)
    private recipeIngredientsRepository: Repository<RecipeIngredientsEntity>,
  ) {}

  async create(
    data: Omit<
      RecipeIngredientsEntity,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
  ): Promise<RecipeIngredientsEntity> {
    const entity = await this.recipeIngredientsRepository.save(
      this.recipeIngredientsRepository.create(data),
    );
    return entity;
  }

  async findById(id: string): Promise<RecipeIngredientsEntity | null> {
    const entity = await this.recipeIngredientsRepository.findOne({
      where: { id },
    });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async findAll(): Promise<RecipeIngredientsEntity[]> {
    const entities = await this.recipeIngredientsRepository.find();
    return entities;
  }

  async update(
    id: string,
    data: Partial<
      Omit<
        RecipeIngredientsEntity,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
      >
    >,
  ): Promise<RecipeIngredientsEntity> {
    const entity = await this.recipeIngredientsRepository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new NotFoundException('Recipe Ingredient not found');
    }
    await this.recipeIngredientsRepository.save({
      ...entity,
      ...data,
    });
    return this.recipeIngredientsRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    await this.recipeIngredientsRepository.softRemove({ id });
  }
}
