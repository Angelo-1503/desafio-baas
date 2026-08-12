import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { User } from '../users/entities/user.entity';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('gateway/:gatewayAccountId/:event')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receptor de webhooks do gateway Lera Box (PAYMENT_PIX, PAYMENT_CARD, WITHDRAWAL)',
  })
  async receive(
    @Param('gatewayAccountId') gatewayAccountId: string,
    @Param('event') event: string,
    @Req() req: Request,
  ) {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from('{}');
    const signature = req.header('x-lera-box-signature');

    await this.webhooksService.handleIncoming(gatewayAccountId, event, rawBody, signature);
    return { received: true };
  }

  @Get('registered')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lista os webhooks registrados no gateway para a conta autenticada' })
  listRegistered(@CurrentUser() user: User) {
    return this.webhooksService.listRegistered(user.id);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '(Re)registra os 3 webhooks (Pix, cartão, saque) para a conta autenticada',
    description:
      'Útil se PUBLIC_BASE_URL mudou ou se o registro automático falhou durante a ativação.',
  })
  async register(@CurrentUser() user: User) {
    await this.webhooksService.registerForUser(user.id);
    return { registered: true };
  }

  @Delete(':gatewayWebhookId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Remove um webhook registrado no gateway (proxy de DELETE /api/webhooks/:id)',
  })
  async remove(@CurrentUser() user: User, @Param('gatewayWebhookId') gatewayWebhookId: string) {
    await this.webhooksService.deleteRegistered(user.id, gatewayWebhookId);
    return { removed: true };
  }
}
