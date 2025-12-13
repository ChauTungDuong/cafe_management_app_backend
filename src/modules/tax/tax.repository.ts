import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaxAndDiscountEntity } from 'src/database/entity/tax-and-discount.entity';
import { Repository } from 'typeorm';
import { CreateTaxDto } from './dto/create-tax.dto';
import { TaxMapper } from './tax.mapper';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Tax } from './tax.domain';
import { parseDateAsUTC7 } from 'src/utils/timezone';

@Injectable()
export class TaxRepository {
  constructor(
    @InjectRepository(TaxAndDiscountEntity)
    private taxRepository: Repository<TaxAndDiscountEntity>,
  ) {}

  async create(createTaxDto: CreateTaxDto): Promise<Tax> {
    const taxEntity = this.taxRepository.create({
      ...createTaxDto,
      isActive: createTaxDto.isActive ?? true, // Default to active
      applyFrom: parseDateAsUTC7(createTaxDto.applyFrom),
      applyTo: parseDateAsUTC7(createTaxDto.applyTo),
    });
    return TaxMapper.toDomain(await this.taxRepository.save(taxEntity));
  }

  async findAll(): Promise<Tax[]> {
    const taxes = await this.taxRepository.find();
    return taxes.map((tax) => TaxMapper.toDomain(tax));
  }

  async findAllActive(): Promise<Tax[]> {
    const now = new Date();
    const taxes = await this.taxRepository
      .createQueryBuilder('tax')
      .where('tax.isActive = :isActive', { isActive: true })
      .andWhere('(tax.applyFrom IS NULL OR tax.applyFrom <= :now)', { now })
      .andWhere('(tax.applyTo IS NULL OR tax.applyTo >= :now)', { now })
      .getMany();
    return taxes.map((tax) => TaxMapper.toDomain(tax));
  }

  async findById(id: Tax['id']): Promise<Tax> {
    const tax = await this.taxRepository.findOne({ where: { id } });
    return TaxMapper.toDomain(tax);
  }

  async findByIds(ids: string[]): Promise<Tax[]> {
    const taxes = await this.taxRepository.findByIds(ids);
    return taxes.map((tax) => TaxMapper.toDomain(tax));
  }

  async update(id: Tax['id'], updateData: UpdateTaxDto): Promise<Tax> {
    const tax = await this.taxRepository.findOne({ where: { id } });
    if (!tax) {
      throw new BadRequestException('Tax/Discount not found');
    }

    const updatePayload: any = { ...updateData };

    // Convert date strings to Date objects if provided
    if (updateData.applyFrom) {
      updatePayload.applyFrom = parseDateAsUTC7(updateData.applyFrom);
    }
    if (updateData.applyTo) {
      updatePayload.applyTo = parseDateAsUTC7(updateData.applyTo);
    }

    return TaxMapper.toDomain(
      await this.taxRepository.save({ ...tax, ...updatePayload }),
    );
  }

  async delete(id: Tax['id']): Promise<void> {
    await this.taxRepository.softRemove({ id });
  }
}
