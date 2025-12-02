import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TableEntity } from 'src/database/entity/table.entity';
import { Repository } from 'typeorm';
import { CreateTableDto } from './dto/create-table.dto';
import { TableMapper } from './table.mapper';
import { UpdateTableDto } from './dto/update-table.dto';
import { Table } from './table.domain';
@Injectable()
export class TableRepository {
  constructor(
    @InjectRepository(TableEntity)
    private tableRepository: Repository<TableEntity>,
  ) {}
  async create(createTableDto: CreateTableDto): Promise<Table> {
    return TableMapper.toDomain(
      await this.tableRepository.save(
        this.tableRepository.create(createTableDto),
      ),
    );
  }

  async findAll(): Promise<Table[]> {
    const entities = await this.tableRepository.find();
    return entities.map((entity) => TableMapper.toDomain(entity));
  }

  async findById(id: Table['id']): Promise<Table> {
    const table = await this.tableRepository.findOne({ where: { id } });
    return TableMapper.toDomain(table);
  }

  async update(id: Table['id'], updateData: UpdateTableDto): Promise<Table> {
    const table = await this.tableRepository.findOne({ where: { id } });
    if (!table) {
      throw new BadRequestException('Table not found');
    }
    return TableMapper.toDomain(
      await this.tableRepository.save({ ...table, ...updateData }),
    );
  }

  async delete(id: Table['id']): Promise<void> {
    await this.tableRepository.softRemove({ id });
  }
}
