import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { GatewayRequestError, GatewayUnauthorizedError } from './gateway.errors';
import type {
  CardBrandGateway,
  GatewayCardPaymentPayload,
  GatewayCardPaymentResponse,
  GatewayCreateUserPayload,
  GatewayFeeRow,
  GatewayFeesResponse,
  GatewayLoginResponse,
  GatewayPixPaymentPayload,
  GatewayPixPaymentResponse,
  GatewayTransaction,
  GatewayTransactionsResponse,
  GatewayTxStatus,
  GatewayTxType,
  GatewayWalletResponse,
  GatewayWebhookPayload,
  GatewayWebhookResponse,
  GatewayWithdrawalPayload,
  GatewayWithdrawalResponse,
} from './interfaces/gateway.types';

/** Chamadas HTTP cruas ao gateway Lera Box. Não lida com persistência ou refresh de token. */
@Injectable()
export class GatewayHttpService {
  private readonly logger = new Logger(GatewayHttpService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('GATEWAY_BASE_URL');
  }

  private authHeader(token: string): AxiosRequestConfig {
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({ baseURL: this.baseUrl, ...config }),
      );
      return response.data;
    } catch (error) {
      throw this.toGatewayError(error as AxiosError, config);
    }
  }

  private toGatewayError(error: AxiosError, config: AxiosRequestConfig): Error {
    const status = error.response?.status;
    const body = error.response?.data as { message?: string | string[] } | undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? error.message);

    this.logger.warn(`Gateway ${config.method?.toUpperCase()} ${config.url} falhou: ${message}`);

    if (status === 401) {
      return new GatewayUnauthorizedError();
    }

    return new GatewayRequestError(status ?? 502, message, body);
  }

  registerUser(payload: GatewayCreateUserPayload): Promise<void> {
    return this.request({ method: 'POST', url: '/users', data: payload });
  }

  login(document: string, password: string): Promise<GatewayLoginResponse> {
    return this.request({ method: 'POST', url: '/auth/login', data: { document, password } });
  }

  async getFees(brand?: CardBrandGateway): Promise<GatewayFeeRow[]> {
    const response = await this.request<GatewayFeesResponse>({
      method: 'GET',
      url: '/fees',
      params: brand ? { brand } : undefined,
    });
    return response.fees;
  }

  getWallet(token: string): Promise<GatewayWalletResponse> {
    return this.request({ method: 'GET', url: '/wallet', ...this.authHeader(token) });
  }

  async getTransactions(
    token: string,
    filters: { limit?: number; status?: GatewayTxStatus; type?: GatewayTxType },
  ): Promise<GatewayTransaction[]> {
    const response = await this.request<GatewayTransactionsResponse>({
      method: 'GET',
      url: '/wallet/transactions',
      params: filters,
      ...this.authHeader(token),
    });
    return response.transactions;
  }

  createPixPayment(
    token: string,
    payload: GatewayPixPaymentPayload,
  ): Promise<GatewayPixPaymentResponse> {
    return this.request({
      method: 'POST',
      url: '/payments/pix',
      data: payload,
      ...this.authHeader(token),
    });
  }

  createCardPayment(
    token: string,
    payload: GatewayCardPaymentPayload,
  ): Promise<GatewayCardPaymentResponse> {
    return this.request({
      method: 'POST',
      url: '/payments/card',
      data: payload,
      ...this.authHeader(token),
    });
  }

  getPayment(token: string, id: string): Promise<GatewayPixPaymentResponse> {
    return this.request({ method: 'GET', url: `/payments/${id}`, ...this.authHeader(token) });
  }

  createWithdrawal(
    token: string,
    payload: GatewayWithdrawalPayload,
  ): Promise<GatewayWithdrawalResponse> {
    return this.request({
      method: 'POST',
      url: '/withdrawals',
      data: payload,
      ...this.authHeader(token),
    });
  }

  getWithdrawal(token: string, id: string): Promise<GatewayWithdrawalResponse> {
    return this.request({ method: 'GET', url: `/withdrawals/${id}`, ...this.authHeader(token) });
  }

  upsertWebhook(token: string, payload: GatewayWebhookPayload): Promise<GatewayWebhookResponse> {
    return this.request({
      method: 'POST',
      url: '/webhooks',
      data: payload,
      ...this.authHeader(token),
    });
  }

  listWebhooks(token: string): Promise<GatewayWebhookResponse[]> {
    return this.request({ method: 'GET', url: '/webhooks', ...this.authHeader(token) });
  }

  deleteWebhook(token: string, id: string): Promise<void> {
    return this.request({ method: 'DELETE', url: `/webhooks/${id}`, ...this.authHeader(token) });
  }
}
