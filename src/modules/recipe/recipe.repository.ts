import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RecipeEntity } from 'src/database/entity/recipe.entity';
import { Repository } from 'typeorm';
import { Recipe } from './recipe.domain';
import { RecipeMapper } from './recipe.mapper';

@Injectable()
export class RecipeRepository {
  constructor(
    @InjectRepository(RecipeEntity)
    private recipeRepository: Repository<RecipeEntity>,
  ) {}

  async findAll(search?: string): Promise<{ data: Recipe[]; total: number }> {
    const qb = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.item', 'item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('recipe.recipeIngredients', 'recipeIngredients')
      .leftJoinAndSelect('recipeIngredients.ingredient', 'ingredient');

    const q = (search ?? '').trim();
    if (q) {
      qb.andWhere('LOWER(item.name) LIKE :q', { q: `%${q.toLowerCase()}%` });
    }

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => RecipeMapper.toDomain(entity)),
      total,
    };
  }

  async findById(id: string): Promise<Recipe> {
    const recipe = await this.recipeRepository.findOne({
      where: { id },
      relations: [
        'item',
        'item.category',
        'recipeIngredients',
        'recipeIngredients.ingredient',
      ],
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    return RecipeMapper.toDomain(recipe);
  }

  async findByIdWithRelations(id: string): Promise<RecipeEntity> {
    const recipe = await this.recipeRepository.findOne({
      where: { id },
      relations: [
        'item',
        'item.category',
        'recipeIngredients',
        'recipeIngredients.ingredient',
      ],
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    return recipe;
  }

  async findByItemId(itemId: string): Promise<Recipe[]> {
    const entities = await this.recipeRepository.find({
      where: { item: { id: itemId } },
      relations: [
        'item',
        'item.category',
        'recipeIngredients',
        'recipeIngredients.ingredient',
      ],
    });
    return entities.map((entity) => RecipeMapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    const recipe = await this.recipeRepository.findOne({ where: { id } });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    await this.recipeRepository.softRemove(recipe);
  }
}
