import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeEntity } from 'src/database/entity/recipe.entity';
import { RecipeIngredientsEntity } from 'src/database/entity/recipe_ingredients.entity';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';
import { RecipeRepository } from './recipe.repository';
import { ItemModule } from '../item/item.module';
import { IngredientModule } from '../ingredient/ingredient.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecipeEntity, RecipeIngredientsEntity]),
    ItemModule,
    IngredientModule,
  ],
  controllers: [RecipeController],
  providers: [RecipeService, RecipeRepository],
  exports: [RecipeRepository],
})
export class RecipeModule {}
