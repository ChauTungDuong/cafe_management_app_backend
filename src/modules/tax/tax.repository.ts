import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaxEntity } from 'src/database/entity/tax.entity';
import { Repository } from 'typeorm';
import { CreateTaxDto } from './dto/create-tax.dto';
import { TaxMapper } from './tax.mapper';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Tax } from './tax.domain';
@Injectable()
export class TaxRepository {
  constructor(
    @InjectRepository(TaxEntity)
    private taxRepository: Repository<TaxEntity>,
  ) {}

  async create(createTaxDto: CreateTaxDto): Promise<Tax> {
    const taxEntity = this.taxRepository.create(createTaxDto);
    return TaxMapper.toDomain(await this.taxRepository.save(taxEntity));
  }

  async findAll(): Promise<Tax[]> {
    const taxes = await this.taxRepository.find();
    return taxes.map((tax) => TaxMapper.toDomain(tax));
  }

  async findById(id: Tax['id']): Promise<Tax> {
    const tax = await this.taxRepository.findOne({ where: { id } });
    return TaxMapper.toDomain(tax);
  }

  async update(id: Tax['id'], updateData: UpdateTaxDto): Promise<Tax> {
    const tax = await this.taxRepository.findOne({ where: { id } });
    if (!tax) {
      throw new BadRequestException('Tax not found');
    }
    return TaxMapper.toDomain(
      await this.taxRepository.save({ ...tax, ...updateData }),
    );
  }

  async delete(id: Tax['id']): Promise<void> {
    await this.taxRepository.softRemove({ id });
  }
}
