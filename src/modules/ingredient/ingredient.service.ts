import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IngredientEntity } from 'src/database/entity/ingredient.entity';
import { MeasureUnit } from 'src/utils/constant';
import { Action, LogEntity } from 'src/database/entity/log.entity';
import { IngredientRepository } from './ingredient.repository';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { BulkCreateIngredientDto } from './dto/bulk-create-ingredient.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ExportDto, ImportDto } from './dto/stock-ingredient.dto';

@Injectable()
export class IngredientService {
  constructor(
    private ingredientRepository: IngredientRepository,
    private cloudinaryService: CloudinaryService,
    private dataSource: DataSource,
  ) {}

  async createIngredient(
    data: CreateIngredientDto,
    image?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;

    if (image) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        image,
        'ingredients',
      );
      imageUrl = (uploadResult as any).secure_url ?? uploadResult.url;
      imagePublicId = uploadResult.public_id;
    }

    return this.ingredientRepository.create({
      ...data,
      image: imageUrl,
      imagePublicId: imagePublicId,
    });
  }

  async bulkCreateIngredients(data: BulkCreateIngredientDto) {
    const { ingredients } = data;
    return this.ingredientRepository.bulkCreate(ingredients);
  }

  async updateIngredient(
    id: string,
    data: UpdateIngredientDto,
    image?: Express.Multer.File,
  ) {
    const existing = await this.ingredientRepository.findById(id);

    let imageUrl = existing.image;
    let imagePublicId = existing.imagePublicId;

    if (image) {
      if (existing.imagePublicId) {
        await this.cloudinaryService.deleteImage(existing.imagePublicId);
      }

      const uploadResult = await this.cloudinaryService.uploadImage(
        image,
        'ingredients',
      );
      imageUrl = (uploadResult as any).secure_url ?? uploadResult.url;
      imagePublicId = uploadResult.public_id;
    }

    return this.ingredientRepository.update(id, {
      ...data,
      image: imageUrl,
      imagePublicId: imagePublicId,
    });
  }

  findAllIngredients() {
    return this.ingredientRepository.findAll();
  }

  findIngredientById(id: string) {
    return this.ingredientRepository.findById(id);
  }

  async deleteIngredient(id: string) {
    const ingredient = await this.ingredientRepository.findById(id);

    // Delete image from Cloudinary if exists
    if (ingredient.imagePublicId) {
      await this.cloudinaryService.deleteImage(ingredient.imagePublicId);
    }

    return this.ingredientRepository.delete(id);
  }

  private convertQuantity(value: number, from: MeasureUnit, to: MeasureUnit) {
    if (!Number.isFinite(value)) {
      throw new BadRequestException('Invalid quantity');
    }
    if (from === to) return value;

    // Weight
    if (from === MeasureUnit.GRAM && to === MeasureUnit.KILOGRAM) {
      return value / 1000;
    }
    if (from === MeasureUnit.KILOGRAM && to === MeasureUnit.GRAM) {
      return value * 1000;
    }

    // Volume
    if (from === MeasureUnit.MILLILITER && to === MeasureUnit.LITER) {
      return value / 1000;
    }
    if (from === MeasureUnit.LITER && to === MeasureUnit.MILLILITER) {
      return value * 1000;
    }

    throw new BadRequestException(
      `Unsupported unit conversion from ${from} to ${to}`,
    );
  }

  private convertUnitCost(value: number, from: MeasureUnit, to: MeasureUnit) {
    if (!Number.isFinite(value)) {
      throw new BadRequestException('Invalid unit cost');
    }
    if (from === to) return value;

    // unit-cost scales inversely with quantity conversion.
    // Example: price per kg -> price per g = price * convertQuantity(1g, g, kg) = price * 0.001
    const factor = this.convertQuantity(1, to, from);
    return value * factor;
  }

  async importIngredient(importDto: ImportDto, actor?: any) {
    if (!importDto?.ingredients?.length) {
      throw new BadRequestException('No ingredients provided');
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of importDto.ingredients) {
        const ingredient = await manager
          .getRepository(IngredientEntity)
          .findOne({
            where: { id: item.ingredientId },
          });
        if (!ingredient) {
          throw new NotFoundException(
            'Ingredient not found: ' + item.ingredientId,
          );
        }

        if (!ingredient.measureUnit) {
          throw new BadRequestException(
            'Ingredient is missing measureUnit: ' + ingredient.id,
          );
        }

        const delta = Number(item.amount);
        if (!Number.isFinite(delta) || delta <= 0) {
          throw new BadRequestException(
            'Import amount must be a positive number for ingredient: ' +
              item.ingredientId,
          );
        }

        const oldQtyInv = Number(ingredient.amountLeft) || 0;
        const inQtyInv = delta;
        ingredient.amountLeft = oldQtyInv + inQtyInv;

        const beforeCost = Number((ingredient as any).pricePerUnit?.price);
        const beforeCostUnit = (ingredient as any).pricePerUnit?.unit;

        // Optional: update unit cost using moving weighted average
        if (item.pricePerUnit !== undefined && item.pricePerUnit !== null) {
          const inUnitCost = Number(item.pricePerUnit);
          if (!Number.isFinite(inUnitCost) || inUnitCost < 0) {
            throw new BadRequestException(
              'Invalid pricePerUnit for ingredient: ' + item.ingredientId,
            );
          }

          // Always normalize/stabilize pricePerUnit to the ingredient's inventory unit.
          // This avoids unit mismatch (recipe amounts have no unit field => assumed measureUnit).
          const costUnit = ingredient.measureUnit as MeasureUnit;

          const existingCostUnit = ((ingredient as any).pricePerUnit?.unit ??
            costUnit) as MeasureUnit;
          const requestedCostUnit =
            ((item.unit ?? existingCostUnit ?? costUnit) as MeasureUnit) ??
            costUnit;

          const oldCostRaw = Number((ingredient as any).pricePerUnit?.price);
          let oldCostNorm = Number.NaN;
          if (Number.isFinite(oldCostRaw)) {
            try {
              oldCostNorm = this.convertUnitCost(
                oldCostRaw,
                existingCostUnit,
                costUnit,
              );
            } catch {
              // If legacy data has incompatible units, treat it as unknown cost.
              oldCostNorm = Number.NaN;
            }
          }

          const inCostNorm = this.convertUnitCost(
            inUnitCost,
            requestedCostUnit,
            costUnit,
          );

          const oldQtyCost = this.convertQuantity(
            oldQtyInv,
            ingredient.measureUnit,
            costUnit,
          );
          const inQtyCost = this.convertQuantity(
            inQtyInv,
            ingredient.measureUnit,
            costUnit,
          );

          let newAvgCost: number;
          // If existing cost is missing/invalid OR 0 (placeholder), adopt the incoming cost.
          if (
            !Number.isFinite(oldCostNorm) ||
            oldCostNorm <= 0 ||
            oldQtyCost <= 0
          ) {
            newAvgCost = inCostNorm;
          } else {
            newAvgCost =
              (oldQtyCost * oldCostNorm + inQtyCost * inCostNorm) /
              (oldQtyCost + inQtyCost);
          }

          (ingredient as any).pricePerUnit = {
            ...(ingredient as any).pricePerUnit,
            price: Number(newAvgCost.toFixed(2)),
            unit: costUnit,
          };
        }

        await manager.getRepository(IngredientEntity).save(ingredient);

        if (actor?.id) {
          const afterCost = Number((ingredient as any).pricePerUnit?.price);
          const afterCostUnit = (ingredient as any).pricePerUnit?.unit;

          await manager.getRepository(LogEntity).save(
            manager.getRepository(LogEntity).create({
              userId: actor.id,
              userName: actor.name,
              userRole: actor.role,
              action: Action.IMPORT,
              entityType: 'ingredient',
              entityId: ingredient.id,
              entityName: ingredient.name,
              message: `${actor.name ?? actor.id} nhập kho '${ingredient.name}' số lượng ${delta}${ingredient.measureUnit}`,
              metadata: {
                amount: delta,
                measureUnit: ingredient.measureUnit,
                oldAmountLeft: oldQtyInv,
                newAmountLeft: ingredient.amountLeft,
                pricePerUnit: item.pricePerUnit,
                priceUnit: item.unit,
                beforeAvgCost: Number.isFinite(beforeCost) ? beforeCost : null,
                beforeAvgCostUnit: beforeCostUnit ?? null,
                afterAvgCost: Number.isFinite(afterCost) ? afterCost : null,
                afterAvgCostUnit: afterCostUnit ?? null,
              },
            }),
          );
        }
      }
    });

    return {
      success: true,
      message: 'Import operation completed successfully',
    };
  }

  async exportIngredient(exportDto: ExportDto, actor?: any) {
    if (!exportDto?.ingredients?.length) {
      throw new BadRequestException('No ingredients provided');
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of exportDto.ingredients) {
        const ingredient = await manager
          .getRepository(IngredientEntity)
          .findOne({
            where: { id: item.ingredientId },
          });
        if (!ingredient) {
          throw new NotFoundException(
            'Ingredient not found: ' + item.ingredientId,
          );
        }

        const delta = Number(item.amount);
        if (!Number.isFinite(delta) || delta <= 0) {
          throw new BadRequestException(
            'Export amount must be a positive number for ingredient: ' +
              item.ingredientId,
          );
        }

        if (Number(ingredient.amountLeft) - delta < 0) {
          throw new BadRequestException(
            'Not enough in-stock to export for ingredient: ' + ingredient.name,
          );
        }

        const oldQtyInv = Number(ingredient.amountLeft) || 0;
        ingredient.amountLeft = oldQtyInv - delta;
        await manager.getRepository(IngredientEntity).save(ingredient);

        if (actor?.id) {
          await manager.getRepository(LogEntity).save(
            manager.getRepository(LogEntity).create({
              userId: actor.id,
              userName: actor.name,
              userRole: actor.role,
              action: Action.EXPORT,
              entityType: 'ingredient',
              entityId: ingredient.id,
              entityName: ingredient.name,
              message: `${actor.name ?? actor.id} xuất kho '${ingredient.name}' số lượng ${delta}${ingredient.measureUnit}`,
              metadata: {
                amount: delta,
                measureUnit: ingredient.measureUnit,
                oldAmountLeft: oldQtyInv,
                newAmountLeft: ingredient.amountLeft,
              },
            }),
          );
        }
      }
    });

    return {
      success: true,
      message: 'Export operation completed successfully',
    };
  }
}
