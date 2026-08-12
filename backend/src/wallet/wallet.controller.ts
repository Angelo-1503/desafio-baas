import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayTxStatus, GatewayTxType } from '../gateway-client/interfaces/gateway.types';
import type { User } from '../users/entities/user.entity';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Saldo da carteira (proxy de GET /api/wallet)' })
  getBalance(@CurrentUser() user: User) {
    return this.walletService.getBalance(user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Extrato de transações (proxy de GET /api/wallet/transactions)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED'],
  })
  @ApiQuery({ name: 'type', required: false, enum: ['PIX', 'CREDIT_CARD', 'WITHDRAWAL'] })
  getTransactions(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('status') status?: GatewayTxStatus,
    @Query('type') type?: GatewayTxType,
  ) {
    return this.walletService.getTransactions(user.id, {
      limit: limit ? Number(limit) : undefined,
      status,
      type,
    });
  }
}
