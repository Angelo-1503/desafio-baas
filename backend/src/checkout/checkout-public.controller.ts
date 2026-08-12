import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { PayWithCardDto } from './dto/pay-with-card.dto';
import { PayWithPixDto } from './dto/pay-with-pix.dto';

@ApiTags('Checkout Público (Pagador)')
@Controller('public/checkout')
export class CheckoutPublicController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Dados públicos do link de pagamento para a página do pagador' })
  getLink(@Param('id') id: string) {
    return this.checkoutService.findPublic(id);
  }

  @Post(':id/pix')
  @ApiOperation({ summary: 'Gera cobrança Pix (QR/EMV) para o link' })
  payWithPix(@Param('id') id: string, @Body() dto: PayWithPixDto) {
    return this.checkoutService.payWithPix(id, dto);
  }

  @Post(':id/card')
  @ApiOperation({ summary: 'Processa pagamento com cartão para o link' })
  payWithCard(@Param('id') id: string, @Body() dto: PayWithCardDto) {
    return this.checkoutService.payWithCard(id, dto);
  }

  @Get(':id/orders/:orderId')
  @ApiOperation({ summary: 'Consulta status de um pedido (polling enquanto aguarda webhook)' })
  getOrder(@Param('id') id: string, @Param('orderId') orderId: string) {
    return this.checkoutService.getPublicOrder(id, orderId);
  }
}
