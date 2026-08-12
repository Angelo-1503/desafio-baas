import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { CardBrandGateway } from '../gateway-client/interfaces/gateway.types';
import { FeesService } from './fees.service';

@ApiTags('Fees')
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  @ApiOperation({ summary: 'Tabela de taxas de cartão (proxy de GET /api/fees do gateway)' })
  @ApiQuery({ name: 'brand', enum: ['VISA', 'MASTERCARD', 'ELO'], required: false })
  getFees(@Query('brand') brand?: CardBrandGateway) {
    return this.feesService.getFees(brand);
  }
}
