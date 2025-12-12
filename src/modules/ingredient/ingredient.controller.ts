import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { BulkCreateIngredientDto } from './dto/bulk-create-ingredient.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('ingredients')
export class IngredientController {
  constructor(private ingredientService: IngredientService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Post()
  createIngredient(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientService.createIngredient(createIngredientDto);
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
  updateIngredient(
    @Param('id') id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ) {
    return this.ingredientService.updateIngredient(id, updateIngredientDto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  deleteIngredient(@Param('id') id: string) {
    return this.ingredientService.deleteIngredient(id);
  }
}
