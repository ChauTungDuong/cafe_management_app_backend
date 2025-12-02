import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { UpdateTableDto } from './dto/update-table.dto';

@Controller('tables')
export class TableController {
  constructor(private tableService: TableService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  createTable(@Body() createTableDto: CreateTableDto) {
    return this.tableService.createTable(createTableDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  getAllTables() {
    return this.tableService.getAllTables();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  getTableById(@Param('id') id: string) {
    return this.tableService.getTableById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  updateTable(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
    return this.tableService.updateTable(id, updateTableDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  deleteTable(@Param('id') id: string) {
    return this.tableService.deleteTable(id);
  }
}
