import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('recipes')
export class RecipeController {
  constructor(private recipeService: RecipeService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Post()
  createRecipe(@Body() createRecipeDto: CreateRecipeDto) {
    return this.recipeService.createRecipe(createRecipeDto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  getAllRecipe() {
    return this.recipeService.findAllRecipes();
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('by-item/:itemId')
  getRecipesByItemId(@Param('itemId') itemId: string) {
    return this.recipeService.findByItemId(itemId);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  getRecipeById(@Param('id') id: string) {
    return this.recipeService.findById(id);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id')
  updateRecipe(
    @Param('id') id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipeService.updateRecipe(id, updateRecipeDto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  deleteRecipe(@Param('id') id: string) {
    return this.recipeService.deleteRecipe(id);
  }
}
