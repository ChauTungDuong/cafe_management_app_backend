import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { BulkCreateIngredientDto } from './dto/bulk-create-ingredient.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFormDataJsonInterceptor } from 'src/utils/parse-form-data.interceptor';

@Controller('ingredients')
export class IngredientController {
  constructor(private ingredientService: IngredientService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Post()
  @UseInterceptors(FileInterceptor('image'), new ParseFormDataJsonInterceptor())
  createIngredient(
    @Body() createIngredientDto: CreateIngredientDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.ingredientService.createIngredient(createIngredientDto, image);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Post('bulk')
  bulkCreateIngredients(@Body() bulkCreateDto: BulkCreateIngredientDto) {
    return this.ingredientService.bulkCreateIngredients(bulkCreateDto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  getAllIngredients() {
    return this.ingredientService.findAllIngredients();
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  getIngredientById(@Param('id') id: string) {
    return this.ingredientService.findIngredientById(id);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'), new ParseFormDataJsonInterceptor())
  updateIngredient(
    @Param('id') id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.ingredientService.updateIngredient(
      id,
      updateIngredientDto,
      image,
    );
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  deleteIngredient(@Param('id') id: string) {
    return this.ingredientService.deleteIngredient(id);
  }
}
