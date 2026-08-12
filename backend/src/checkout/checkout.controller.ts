import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { User } from '../users/entities/user.entity';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutLinkDto } from './dto/create-checkout-link.dto';
import { SendCheckoutLinkEmailDto } from './dto/send-checkout-link-email.dto';

@ApiTags('Checkout Links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkout-links')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo link de pagamento' })
  create(@CurrentUser() user: User, @Body() dto: CreateCheckoutLinkDto) {
    return this.checkoutService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os links de pagamento do lojista autenticado' })
  list(@CurrentUser() user: User) {
    return this.checkoutService.listForOwner(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um link de pagamento' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.checkoutService.findForOwner(user.id, id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Lista as tentativas de pagamento (orders) de um link' })
  listOrders(@CurrentUser() user: User, @Param('id') id: string) {
    return this.checkoutService.listOrdersForOwner(user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancela um link de pagamento ativo' })
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.checkoutService.cancel(user.id, id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Envia o link de pagamento por e-mail ao pagador' })
  sendByEmail(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: SendCheckoutLinkEmailDto,
  ) {
    return this.checkoutService.sendByEmail(user.id, id, dto);
  }
}
