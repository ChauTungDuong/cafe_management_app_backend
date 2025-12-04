import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemService } from './item.service';
import { UpdateItemDto } from './dto/update-item.dto';
import { BulkCreateItemDto } from './dto/bulk-create-item.dto';
import { Public, Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFormDataJsonInterceptor } from 'src/utils/parse-form-data.interceptor';

@Controller('items')
export class ItemController {
  constructor(private itemService: ItemService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Post()
  @UseInterceptors(FileInterceptor('image'), new ParseFormDataJsonInterceptor())
  createItem(
    @Body() createItemDto: CreateItemDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.itemService.createItem(createItemDto, image);
  }
  @Roles(Role.ADMIN)
  @Post('bulk')
  bulkCreateItems(@Body() bulkCreateItemDto: BulkCreateItemDto) {
    return this.itemService.bulkCreateItems(bulkCreateItemDto);
  }

  @Public()
  @Get()
  getAllItems(@Query() filtersDto: any) {
    return this.itemService.getAllItems(filtersDto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  getItemById(@Param('id') id: string) {
    return this.itemService.getItemById(id);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'), new ParseFormDataJsonInterceptor())
  updateItem(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.itemService.updateItem(id, updateItemDto, image);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  deleteItem(@Param('id') id: string) {
    return this.itemService.deleteItem(id);
  }
}
