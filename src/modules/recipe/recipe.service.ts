import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RecipeRepository } from './recipe.repository';
import { IngredientRepository } from '../ingredient/ingredient.repository';
import { ItemRepository } from '../item/item.repository';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { DataSource } from 'typeorm';
import { RecipeEntity } from 'src/database/entity/recipe.entity';
import { RecipeIngredientsEntity } from 'src/database/entity/recipe_ingredients.entity';
import { RecipeMapper } from './recipe.mapper';

@Injectable()
export class RecipeService {
  constructor(
    private recipeRepository: RecipeRepository,
    private ingredientRepository: IngredientRepository,
    private itemRepository: ItemRepository,
    private dataSource: DataSource,
  ) {}

  async createRecipe(data: CreateRecipeDto) {
    const item = await this.itemRepository.findById(data.itemId);
    if (!item) {
      throw new NotFoundException(`Item with id ${data.itemId} not found`);
    }

    if (!data.ingredients || data.ingredients.length === 0) {
      throw new BadRequestException('At least one ingredient is required');
    }

    const ingredientIds = data.ingredients.map((i) => i.ingredientId);
    const uniqueIds = new Set(ingredientIds);
    if (uniqueIds.size !== ingredientIds.length) {
      throw new BadRequestException('Duplicate ingredients are not allowed');
    }

    for (const ingredientItem of data.ingredients) {
      const ingredient = await this.ingredientRepository.findById(
        ingredientItem.ingredientId,
      );
      if (!ingredient) {
        throw new NotFoundException(
          `Ingredient with id ${ingredientItem.ingredientId} not found`,
        );
      }
      if (ingredientItem.amount <= 0) {
        throw new BadRequestException('Ingredient amount must be positive');
      }
    }

    return await this.dataSource.transaction(async (manager) => {
      const recipeRepo = manager.getRepository(RecipeEntity);
      const recipeIngRepo = manager.getRepository(RecipeIngredientsEntity);

      const recipeEntity = recipeRepo.create({
        item: { id: data.itemId } as any,
      });
      const savedRecipe = await recipeRepo.save(recipeEntity);

      const recipeIngredients = data.ingredients.map((ing) =>
        recipeIngRepo.create({
          recipe: savedRecipe,
          ingredient: { id: ing.ingredientId } as any,
          amount: ing.amount,
        }),
      );
      await recipeIngRepo.save(recipeIngredients);

      const fullRecipe = await recipeRepo.findOne({
        where: { id: savedRecipe.id },
        relations: [
          'item',
          'item.category',
          'recipeIngredients',
          'recipeIngredients.ingredient',
        ],
      });

      return RecipeMapper.toDomain(fullRecipe);
    });
  }

  async findAllRecipes(search?: string) {
    return this.recipeRepository.findAll(search);
  }

  async findById(id: string) {
    return this.recipeRepository.findById(id);
  }

  async findByItemId(itemId: string) {
    return this.recipeRepository.findByItemId(itemId);
  }

  async updateRecipe(id: string, data: UpdateRecipeDto) {
    const existingRecipe =
      await this.recipeRepository.findByIdWithRelations(id);
    if (!existingRecipe) {
      throw new NotFoundException(`Recipe with id ${id} not found`);
    }

    if (data.itemId) {
      const item = await this.itemRepository.findById(data.itemId);
      if (!item) {
        throw new NotFoundException(`Item with id ${data.itemId} not found`);
      }
    }

    if (data.ingredients) {
      if (data.ingredients.length === 0) {
        throw new BadRequestException('At least one ingredient is required');
      }

      const ingredientIds = data.ingredients.map((i) => i.ingredientId);
      const uniqueIds = new Set(ingredientIds);
      if (uniqueIds.size !== ingredientIds.length) {
        throw new BadRequestException('Duplicate ingredients are not allowed');
      }

      for (const ingredientItem of data.ingredients) {
        const ingredient = await this.ingredientRepository.findById(
          ingredientItem.ingredientId,
        );
        if (!ingredient) {
          throw new NotFoundException(
            `Ingredient with id ${ingredientItem.ingredientId} not found`,
          );
        }
        if (ingredientItem.amount <= 0) {
          throw new BadRequestException('Ingredient amount must be positive');
        }
      }
    }

    return await this.dataSource.transaction(async (manager) => {
      const recipeRepo = manager.getRepository(RecipeEntity);
      const recipeIngRepo = manager.getRepository(RecipeIngredientsEntity);

      if (data.itemId) {
        await recipeRepo.update(id, { item: { id: data.itemId } as any });
      }

      if (data.ingredients) {
        const existing = await recipeIngRepo.find({
          where: { recipe: { id } },
          relations: ['ingredient'],
        });

        const existingMap = new Map(
          existing.map((ri) => [ri.ingredient.id, ri]),
        );
        const incomingMap = new Map(
          data.ingredients.map((ing) => [ing.ingredientId, ing]),
        );

        const toDelete = existing.filter(
          (ri) => !incomingMap.has(ri.ingredient.id),
        );
        const toCreate = data.ingredients.filter(
          (ing) => !existingMap.has(ing.ingredientId),
        );
        const toUpdate = data.ingredients.filter((ing) =>
          existingMap.has(ing.ingredientId),
        );

        if (toDelete.length > 0) {
          await recipeIngRepo.softRemove(toDelete);
        }

        if (toCreate.length > 0) {
          const newEntities = toCreate.map((ing) =>
            recipeIngRepo.create({
              recipe: { id } as any,
              ingredient: { id: ing.ingredientId } as any,
              amount: ing.amount,
            }),
          );
          await recipeIngRepo.save(newEntities);
        }

        for (const ing of toUpdate) {
          const existing = existingMap.get(ing.ingredientId);
          if (existing.amount !== ing.amount) {
            await recipeIngRepo.update(existing.id, { amount: ing.amount });
          }
        }
      }

      const updatedRecipe = await recipeRepo.findOne({
        where: { id },
        relations: [
          'item',
          'item.category',
          'recipeIngredients',
          'recipeIngredients.ingredient',
        ],
      });

      return RecipeMapper.toDomain(updatedRecipe);
    });
  }

  async deleteRecipe(id: string) {
    return this.recipeRepository.delete(id);
  }
}
