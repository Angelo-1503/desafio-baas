import { Injectable } from '@nestjs/common';
import { GatewayAccountService } from '../gateway-client/gateway-account.service';
import { GatewayHttpService } from '../gateway-client/gateway-http.service';
import type { GatewayTxStatus, GatewayTxType } from '../gateway-client/interfaces/gateway.types';

export interface TransactionFilters {
  limit?: number;
  status?: GatewayTxStatus;
  type?: GatewayTxType;
}

@Injectable()
export class WalletService {
  constructor(
    private readonly gatewayAccountService: GatewayAccountService,
    private readonly gatewayHttpService: GatewayHttpService,
  ) {}

  getBalance(userId: string) {
    return this.gatewayAccountService.withAuth(userId, (token) =>
      this.gatewayHttpService.getWallet(token),
    );
  }

  getTransactions(userId: string, filters: TransactionFilters) {
    return this.gatewayAccountService.withAuth(userId, (token) =>
      this.gatewayHttpService.getTransactions(token, filters),
    );
  }
}
