import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecipeEntity } from './recipe.entity';
import { MeasureUnit } from 'src/utils/constant';
import { RecipeIngredientsEntity } from './recipe_ingredients.entity';

export class PriceUnit {
  // Keep nullable to avoid schema-sync failures when legacy rows contain NULL.
  // Domain/mappers treat NULL as 0.
  @Column('decimal', { precision: 12, scale: 2, default: 0, nullable: true })
  price: number;

  @Column({ type: 'enum', enum: MeasureUnit, nullable: true })
  unit: MeasureUnit;
}

@Entity('ingredient')
export class IngredientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  amountLeft: number;

  @Column({ type: 'enum', enum: MeasureUnit, nullable: true })
  measureUnit: MeasureUnit;

  @Column({ nullable: true, default: 0 })
  minAmount?: number;

  @Column(() => PriceUnit)
  pricePerUnit: PriceUnit;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  imagePublicId?: string;

  @OneToMany(
    () => RecipeIngredientsEntity,
    (recipeIngredient) => recipeIngredient.ingredient,
  )
  includedInRecipe: RecipeIngredientsEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
