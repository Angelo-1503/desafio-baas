import { Injectable } from '@nestjs/common';
import { GatewayHttpService } from '../gateway-client/gateway-http.service';
import type { CardBrandGateway, GatewayFeeRow } from '../gateway-client/interfaces/gateway.types';

const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class FeesService {
  private cache = new Map<string, { rows: GatewayFeeRow[]; expiresAt: number }>();

  constructor(private readonly gatewayHttpService: GatewayHttpService) {}

  async getFees(brand?: CardBrandGateway): Promise<GatewayFeeRow[]> {
    const key = brand ?? 'ALL';
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.rows;
    }

    const rows = await this.gatewayHttpService.getFees(brand);
    this.cache.set(key, { rows, expiresAt: Date.now() + CACHE_TTL_MS });
    return rows;
  }

  /** Usado pelo checkout para validar que o feePercent enviado bate com a tabela oficial. */
  async findFeePercent(brand: CardBrandGateway, installments: number): Promise<number | undefined> {
    const rows = await this.getFees(brand);
    return rows.find((row) => row.installments === installments)?.feePercent;
  }
}
