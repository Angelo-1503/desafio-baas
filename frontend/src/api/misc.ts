import { api } from './client';
import type { CardBrand, FeeRow, ReceiptData, WebhookRegistered } from './types';

export const feesApi = {
  list: (brand?: CardBrand) => api.get<FeeRow[]>(`/fees${brand ? `?brand=${brand}` : ''}`, false),
};

export const webhooksApi = {
  listRegistered: () => api.get<WebhookRegistered[]>('/webhooks/registered'),
  remove: (gatewayWebhookId: string) =>
    api.delete<{ removed: boolean }>(`/webhooks/${gatewayWebhookId}`),
};

export const receiptsApi = {
  get: (orderId: string) => api.get<ReceiptData>(`/public/receipts/${orderId}`, false),
};
