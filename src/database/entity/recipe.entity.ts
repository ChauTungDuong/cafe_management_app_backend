import { Delete } from '@nestjs/common';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ItemEntity } from './item.entity';
import { IngredientEntity } from './ingredient.entity';
import { RecipeIngredientsEntity } from './recipe_ingredients.entity';
@Entity('recipe')
export class RecipeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ItemEntity, (item) => item.recipes)
  @JoinColumn({ name: 'itemId' })
  item: ItemEntity;

  @OneToMany(
    () => RecipeIngredientsEntity,
    (recipeIngredient) => recipeIngredient.recipe,
    { cascade: true },
  )
  recipeIngredients: RecipeIngredientsEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
