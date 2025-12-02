import { Injectable } from '@nestjs/common';
import { TableRepository } from './table.repository';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TableService {
  constructor(private tableRepository: TableRepository) {}

  createTable(createTableDto: CreateTableDto) {
    return this.tableRepository.create(createTableDto);
  }
  getAllTables() {
    return this.tableRepository.findAll();
  }
  getTableById(id: string) {
    return this.tableRepository.findById(id);
  }
  updateTable(id: string, updateData: UpdateTableDto) {
    return this.tableRepository.update(id, updateData);
  }
  deleteTable(id: string) {
    return this.tableRepository.delete(id);
  }
}
