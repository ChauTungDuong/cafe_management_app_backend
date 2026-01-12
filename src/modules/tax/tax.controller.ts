import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TaxService } from './tax.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Controller('taxes')
export class TaxController {
  constructor(private taxService: TaxService) {}

  @Post()
  @Roles(Role.ADMIN)
  createTax(@Body() createTaxDto: CreateTaxDto) {
    return this.taxService.createTax(createTaxDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  getAllTaxes() {
    return this.taxService.getAllTaxes();
  }

  @Get('active/list')
  @Roles(Role.ADMIN, Role.STAFF)
  getActiveTaxes() {
    return this.taxService.getActiveTaxes();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  getTaxById(@Param('id') id: string) {
    return this.taxService.getTaxById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  updateTax(@Param('id') id: string, @Body() updateData: UpdateTaxDto) {
    return this.taxService.updateTax(id, updateData);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteTax(@Param('id') id: string) {
    return this.taxService.deleteTax(id);
  }
}
