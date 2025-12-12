import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngredientEntity } from 'src/database/entity/ingredient.entity';
import { Repository } from 'typeorm';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { Ingredient } from './ingredient.domain';
import { IngredientMapper } from './ingredient.mapper';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
@Injectable()
export class IngredientRepository {
  constructor(
    @InjectRepository(IngredientEntity)
    private ingredientRepository: Repository<IngredientEntity>,
  ) {}

  async create(data: CreateIngredientDto): Promise<Ingredient> {
    const ingredientEntity = await this.ingredientRepository.save(
      this.ingredientRepository.create(data),
    );
    return IngredientMapper.toDomain(ingredientEntity);
  }

  async bulkCreate(dataArray: CreateIngredientDto[]): Promise<Ingredient[]> {
    const entities = this.ingredientRepository.create(dataArray);
    const savedEntities = await this.ingredientRepository.save(entities);
    return savedEntities.map((entity) => IngredientMapper.toDomain(entity));
  }

  async findAll(): Promise<Ingredient[]> {
    const ingredientEntities = await this.ingredientRepository.find();
    return ingredientEntities.map((entity) =>
      IngredientMapper.toDomain(entity),
    );
  }

  async findById(id: Ingredient['id']): Promise<Ingredient | null> {
    const ingredientEntity = await this.ingredientRepository.findOne({
      where: { id },
      relations: ['includedInRecipe'],
    });
    if (!ingredientEntity) {
      throw new NotFoundException('Ingredient not found');
    }
    return IngredientMapper.toDomain(ingredientEntity);
  }

  async update(
    id: Ingredient['id'],
    data: UpdateIngredientDto,
  ): Promise<Ingredient> {
    const ingredientEntity = await this.ingredientRepository.findOne({
      where: { id },
    });
    if (!ingredientEntity) {
      throw new NotFoundException('Ingredient not found');
    }
    await this.ingredientRepository.save({
      ...ingredientEntity,
      ...data,
    });
    return IngredientMapper.toDomain(
      await this.ingredientRepository.findOne({ where: { id } }),
    );
  }
  async delete(id: Ingredient['id']) {
    const ingredient = await this.findById(id);
    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }
    await this.ingredientRepository.softRemove(ingredient);
  }
}
