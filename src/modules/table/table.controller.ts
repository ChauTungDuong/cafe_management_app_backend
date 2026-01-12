import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { UpdateTableDto } from './dto/update-table.dto';

@Controller('tables')
export class TableController {
  constructor(private tableService: TableService) {}

  @Post()
  @Roles(Role.ADMIN)
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
  updateTable(
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
    @Req() req: Request,
  ) {
    // Staff is only allowed to update the table status.
    const actor: any = (req as any).user;
    if (actor?.role === Role.STAFF) {
      const { status, ...rest } = (updateTableDto as any) ?? {};
      const hasOtherFields = Object.values(rest).some(
        (v) => v !== undefined && v !== null && v !== '',
      );
      if (hasOtherFields) {
        throw new ForbiddenException(
          'Staff can only update table status (status field).',
        );
      }
    }
    return this.tableService.updateTable(id, updateTableDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteTable(@Param('id') id: string) {
    return this.tableService.deleteTable(id);
  }
}
