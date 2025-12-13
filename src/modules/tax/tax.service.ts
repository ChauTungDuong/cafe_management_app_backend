import { Injectable } from '@nestjs/common';
import { TaxRepository } from './tax.repository';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class TaxService {
  constructor(private taxRepository: TaxRepository) {}

  createTax(createTaxDto: CreateTaxDto) {
    return this.taxRepository.create(createTaxDto);
  }

  getAllTaxes() {
    return this.taxRepository.findAll();
  }

  getActiveTaxes() {
    return this.taxRepository.findAllActive();
  }

  getTaxById(id: string) {
    return this.taxRepository.findById(id);
  }
  updateTax(id: string, updateData: UpdateTaxDto) {
    return this.taxRepository.update(id, updateData);
  }
  deleteTax(id: string) {
    return this.taxRepository.delete(id);
  }
}
