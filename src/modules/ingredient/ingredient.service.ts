import { Injectable } from '@nestjs/common';
import { IngredientRepository } from './ingredient.repository';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { BulkCreateIngredientDto } from './dto/bulk-create-ingredient.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class IngredientService {
  constructor(
    private ingredientRepository: IngredientRepository,
    private cloudinaryService: CloudinaryService,
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
      imageUrl = uploadResult.url;
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
      // Delete old image if exists
      if (existing.imagePublicId) {
        await this.cloudinaryService.deleteImage(existing.imagePublicId);
      }

      // Upload new image
      const uploadResult = await this.cloudinaryService.uploadImage(
        image,
        'ingredients',
      );
      imageUrl = uploadResult.url;
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
}
