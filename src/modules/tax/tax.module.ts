import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxEntity } from 'src/database/entity/tax.entity';
import { TaxController } from './tax.controller';
import { TaxRepository } from './tax.repository';
import { TaxService } from './tax.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaxEntity])],
  controllers: [TaxController],
  providers: [TaxRepository, TaxService],
  exports: [TaxRepository],
})
export class TaxModule {}
