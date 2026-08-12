import { api } from './client';
import type { GatewayStatus, WalletBalance, WalletTransaction } from './types';

export interface TransactionFilters {
  status?: GatewayStatus;
  type?: 'PIX' | 'CREDIT_CARD' | 'WITHDRAWAL';
  limit?: number;
}

function buildQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const walletApi = {
  getBalance: () => api.get<WalletBalance>('/wallet'),
  getTransactions: (filters: TransactionFilters = {}) =>
    api.get<WalletTransaction[]>(`/wallet/transactions${buildQuery(filters)}`),
};
