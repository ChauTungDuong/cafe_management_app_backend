import { Injectable } from '@nestjs/common';
import { IngredientRepository } from './ingredient.repository';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { BulkCreateIngredientDto } from './dto/bulk-create-ingredient.dto';

@Injectable()
export class IngredientService {
  constructor(private ingredientRepository: IngredientRepository) {}

  createIngredient(data: CreateIngredientDto) {
    return this.ingredientRepository.create(data);
  }

  async bulkCreateIngredients(data: BulkCreateIngredientDto) {
    const { ingredients } = data;
    return this.ingredientRepository.bulkCreate(ingredients);
  }
  updateIngredient(id: string, data: UpdateIngredientDto) {
    return this.ingredientRepository.update(id, data);
  }
  findAllIngredients() {
    return this.ingredientRepository.findAll();
  }
  findIngredientById(id: string) {
    return this.ingredientRepository.findById(id);
  }
  deleteIngredient(id: string) {
    return this.ingredientRepository.delete(id);
  }
}
