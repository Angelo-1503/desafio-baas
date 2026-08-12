import { api } from './client';
import type { Withdrawal } from './types';

export interface CreateWithdrawalPayload {
  amountCents: number;
  pixKey: string;
  description?: string;
  document: string;
}

export const withdrawalsApi = {
  create: (payload: CreateWithdrawalPayload) => api.post<Withdrawal>('/withdrawals', payload),
  list: () => api.get<Withdrawal[]>('/withdrawals'),
  get: (id: string) => api.get<Withdrawal>(`/withdrawals/${id}`),
};
