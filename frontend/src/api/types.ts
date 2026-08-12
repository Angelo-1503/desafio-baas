export type PersonType = 'PF' | 'PJ';
export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO';
export type GatewayStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';
export type PaymentMethod = 'PIX' | 'CARD';
export type CheckoutLinkStatus = 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface GatewayAccountView {
  id: string;
  userId: string;
  document: string;
  status: 'PENDING_ACTIVATION' | 'ACTIVE';
  codigoCliente?: string;
  chaveLoja?: string;
}

export interface CheckoutLink {
  id: string;
  userId: string;
  amountCents: number;
  description?: string;
  allowedMethods: PaymentMethod[];
  status: CheckoutLinkStatus;
  expiresAt: string;
  createdAt: string;
  cardBrand?: CardBrand;
  cardInstallments?: number;
  cardFeePercent?: string;
}

export interface Order {
  id: string;
  checkoutLinkId: string;
  method: PaymentMethod;
  status: GatewayStatus;
  amountCents: number;
  feePercent?: string;
  feeAmountCents?: number;
  netAmountCents?: number;
  brand?: CardBrand;
  installments?: number;
  cardLast4?: string;
  externalReference: string;
  payerDocument?: string;
  qrCodeBase64?: string;
  emv?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeRow {
  brand: CardBrand;
  installments: number;
  feePercent: number;
  feePercentFormatted?: string;
}

export interface WalletBalance {
  balance: number;
}

export interface WalletTransaction {
  id: string;
  type: 'PIX' | 'CREDIT_CARD' | 'WITHDRAWAL';
  status: GatewayStatus;
  amount: number;
  externalReference?: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  amountCents: number;
  pixKey: string;
  description?: string;
  document: string;
  externalReference: string;
  status: GatewayStatus;
  createdAt: string;
}

export interface WebhookRegistered {
  id: string;
  event: 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';
  url: string;
}

export interface ReceiptData {
  order: Order;
  checkoutLink?: CheckoutLink;
  formattedAmount: string;
  formattedNetAmount?: string;
}
