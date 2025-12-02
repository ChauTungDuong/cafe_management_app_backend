import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableEntity } from 'src/database/entity/table.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableRepository } from './table.repository';
import { TableService } from './table.service';

@Module({
  imports: [TypeOrmModule.forFeature([TableEntity])],
  controllers: [TableController],
  providers: [TableRepository, TableService],
  exports: [TableRepository],
})
export class TableModule {}
