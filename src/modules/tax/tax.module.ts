import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxAndDiscountEntity } from 'src/database/entity/tax-and-discount.entity';
import { TaxController } from './tax.controller';
import { TaxRepository } from './tax.repository';
import { TaxService } from './tax.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaxAndDiscountEntity])],
  controllers: [TaxController],
  providers: [TaxRepository, TaxService],
  exports: [TaxRepository, TaxService],
})
export class TaxModule {}
