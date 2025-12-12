import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IngredientEntity } from './ingredient.entity';
import { RecipeEntity } from './recipe.entity';
@Entity('recipe_ingredients')
export class RecipeIngredientsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => IngredientEntity,
    (ingredient) => ingredient.includedInRecipe,
  )
  @JoinColumn({ name: 'ingredientId' })
  ingredient: IngredientEntity;

  @ManyToOne(() => RecipeEntity, (recipe) => recipe.recipeIngredients)
  @JoinColumn({ name: 'recipeId' })
  recipe: RecipeEntity;

  @Column()
  amount: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
