import { api } from './client';
import type { CardBrand, CheckoutLink, Order, PaymentMethod } from './types';

export interface CreateCheckoutLinkPayload {
  amountCents: number;
  description?: string;
  allowedMethods: PaymentMethod[];
  expiresInMinutes?: number;
  cardBrand?: CardBrand;
  cardInstallments?: number;
}

export const checkoutApi = {
  create: (payload: CreateCheckoutLinkPayload) =>
    api.post<CheckoutLink>('/checkout-links', payload),
  list: () => api.get<CheckoutLink[]>('/checkout-links'),
  get: (id: string) => api.get<CheckoutLink>(`/checkout-links/${id}`),
  listOrders: (id: string) => api.get<Order[]>(`/checkout-links/${id}/orders`),
  cancel: (id: string) => api.post<CheckoutLink>(`/checkout-links/${id}/cancel`),
  sendByEmail: (id: string, email: string) =>
    api.post<{ sent: boolean }>(`/checkout-links/${id}/send`, { email }),
};

export const publicCheckoutApi = {
  getLink: (id: string) => api.get<CheckoutLink>(`/public/checkout/${id}`, false),
  payWithPix: (id: string, payerDocument: string) =>
    api.post<Order>(`/public/checkout/${id}/pix`, { payerDocument }, false),
  payWithCard: (
    id: string,
    payload: {
      cardNumber: string;
      cardHolder: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
    },
  ) => api.post<Order>(`/public/checkout/${id}/card`, payload, false),
  getOrder: (linkId: string, orderId: string) =>
    api.get<Order>(`/public/checkout/${linkId}/orders/${orderId}`, false),
};
