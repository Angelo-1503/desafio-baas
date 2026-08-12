export type PersonType = 'PF' | 'PJ';
export type CardBrandGateway = 'VISA' | 'MASTERCARD' | 'ELO';
export type GatewayTxStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';
export type GatewayTxType = 'PIX' | 'CREDIT_CARD' | 'WITHDRAWAL';
export type WebhookEventName = 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';

export interface GatewayCreateUserPayload {
  personType: PersonType;
  name: string;
  tradingName?: string;
  email: string;
  phone: string;
  document: string;
  zipCode: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface GatewayLoginResponse {
  access_token: string;
  token_type?: string;
  codigoCliente: number | string;
  chaveLoja: string;
}

export interface GatewayFeeRow {
  id?: string;
  brand: CardBrandGateway;
  installments: number;
  feePercent: number;
  feePercentFormatted?: string;
}

export interface GatewayFeesResponse {
  total: number;
  fees: GatewayFeeRow[];
}

export interface GatewayWalletResponse {
  balance: number;
}

export interface GatewayTransaction {
  id: string;
  type: GatewayTxType;
  status: GatewayTxStatus;
  amount: number;
  externalReference?: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface GatewayTransactionsResponse {
  walletId: string;
  balance: number;
  balanceFormatted?: string;
  filters?: unknown;
  transactions: GatewayTransaction[];
}

export interface GatewayPixPaymentPayload {
  amount: number;
  description?: string;
  payerDocument: string;
  externalReference?: string;
}

export interface GatewayPixPaymentResponse {
  id: string;
  status: GatewayTxStatus;
  qrCodeBase64: string;
  emv: string;
  txid: string;
  [key: string]: unknown;
}

export interface GatewayCardPaymentPayload {
  amount: number;
  description?: string;
  externalReference?: string;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  installments: number;
  feePercent: number;
}

export interface GatewayCardPaymentResponse {
  id: string;
  status: GatewayTxStatus;
  [key: string]: unknown;
}

export interface GatewayWithdrawalPayload {
  amount: number;
  pixKey: string;
  description?: string;
  externalReference?: string;
  document: string;
}

export interface GatewayWithdrawalResponse {
  id: string;
  status: GatewayTxStatus;
  [key: string]: unknown;
}

export interface GatewayWebhookPayload {
  event: WebhookEventName;
  url: string;
  secret?: string;
}

export interface GatewayWebhookResponse {
  id: string;
  event: WebhookEventName;
  url: string;
  [key: string]: unknown;
}
