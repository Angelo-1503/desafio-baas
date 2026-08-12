import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { CheckoutLink, CheckoutLinkStatus } from '../checkout/entities/checkout-link.entity';
import { Order } from '../checkout/entities/order.entity';
import { GatewayStatus } from '../common/enums/gateway-status.enum';
import { GatewayAccount } from '../gateway-client/entities/gateway-account.entity';
import { GatewayAccountService } from '../gateway-client/gateway-account.service';
import { GatewayHttpService } from '../gateway-client/gateway-http.service';
import type { WebhookEventName } from '../gateway-client/interfaces/gateway.types';
import { Transaction, TransactionType } from '../wallet/entities/transaction.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { WebhookEvent, WebhookEventType } from './entities/webhook-event.entity';

const EVENT_BY_PATH: Record<string, { event: WebhookEventName; type: WebhookEventType }> = {
  pix: { event: 'PAYMENT_PIX', type: WebhookEventType.PAYMENT_PIX },
  card: { event: 'PAYMENT_CARD', type: WebhookEventType.PAYMENT_CARD },
  withdrawal: { event: 'WITHDRAWAL', type: WebhookEventType.WITHDRAWAL },
};

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly publicBaseUrl: string;

  constructor(
    @InjectRepository(GatewayAccount)
    private readonly gatewayAccountRepository: Repository<GatewayAccount>,
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepository: Repository<WebhookEvent>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(CheckoutLink)
    private readonly checkoutLinkRepository: Repository<CheckoutLink>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly gatewayHttpService: GatewayHttpService,
    private readonly gatewayAccountService: GatewayAccountService,
    configService: ConfigService,
  ) {
    this.publicBaseUrl = configService.getOrThrow<string>('PUBLIC_BASE_URL');
  }

  /** Permite (re)registrar os webhooks de uma conta já ativa — útil se PUBLIC_BASE_URL mudou
   * ou se o registro automático falhou durante a ativação (ex: URL pública ainda não pronta). */
  async registerForUser(userId: string): Promise<void> {
    const account = await this.gatewayAccountRepository.findOne({ where: { userId } });
    if (!account) {
      throw new NotFoundException('Conta do gateway não encontrada para este usuário');
    }
    await this.registerDefaultWebhooks(account);
  }

  async registerDefaultWebhooks(gatewayAccount: GatewayAccount): Promise<void> {
    const paths: Array<keyof typeof EVENT_BY_PATH> = ['pix', 'card', 'withdrawal'];

    await this.gatewayAccountService.withAuth(gatewayAccount.userId, async (token) => {
      for (const path of paths) {
        const { event } = EVENT_BY_PATH[path];
        await this.gatewayHttpService.upsertWebhook(token, {
          event,
          url: `${this.publicBaseUrl}/webhooks/gateway/${gatewayAccount.id}/${path}`,
          secret: gatewayAccount.webhookSecret,
        });
      }
    });
  }

  private isValidSignature(
    rawBody: Buffer,
    secret: string,
    signature: string | undefined,
  ): boolean {
    if (!signature) return false;

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  }

  async handleIncoming(
    gatewayAccountId: string,
    path: string,
    rawBody: Buffer,
    signatureHeader: string | undefined,
  ): Promise<void> {
    const mapping = EVENT_BY_PATH[path];
    if (!mapping) {
      throw new NotFoundException(`Evento de webhook desconhecido: ${path}`);
    }

    const account = await this.gatewayAccountRepository.findOne({
      where: { id: gatewayAccountId },
    });
    if (!account) {
      throw new NotFoundException('Conta do gateway não encontrada');
    }

    const signatureValid = this.isValidSignature(rawBody, account.webhookSecret, signatureHeader);
    if (!signatureValid) {
      this.logger.warn(`Assinatura inválida no webhook ${path} para conta ${gatewayAccountId}`);
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
    const gatewayId = String(payload.id ?? payload.paymentId ?? payload.withdrawalId ?? '');
    const externalReference = payload.externalReference ? String(payload.externalReference) : '';
    const status = String(payload.status ?? 'PENDING') as GatewayStatus;
    const idempotencyKey = `${mapping.event}:${gatewayId || externalReference}`;

    const alreadyProcessed = await this.webhookEventRepository.findOne({
      where: { idempotencyKey },
    });
    if (alreadyProcessed) {
      this.logger.log(`Webhook duplicado ignorado: ${idempotencyKey}`);
      return;
    }

    const webhookEvent = this.webhookEventRepository.create({
      event: mapping.type,
      gatewayAccountId,
      idempotencyKey,
      signatureValid,
      rawPayload: payload,
      processed: false,
    });

    try {
      if (mapping.event === 'WITHDRAWAL') {
        await this.applyWithdrawalUpdate(gatewayId, externalReference, status);
        await this.mirrorTransaction(
          account.userId,
          TransactionType.WITHDRAWAL,
          gatewayId,
          externalReference,
          status,
          payload,
        );
      } else {
        await this.applyOrderUpdate(gatewayId, externalReference, status);
        await this.mirrorTransaction(
          account.userId,
          mapping.event === 'PAYMENT_PIX' ? TransactionType.PIX : TransactionType.CREDIT_CARD,
          gatewayId,
          externalReference,
          status,
          payload,
        );
      }

      webhookEvent.processed = true;
      webhookEvent.processedAt = new Date();
    } catch (error) {
      webhookEvent.processingError = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Falha ao processar webhook ${idempotencyKey}`,
        webhookEvent.processingError,
      );
    }

    await this.webhookEventRepository.save(webhookEvent);
  }

  private async applyOrderUpdate(
    gatewayId: string,
    externalReference: string,
    status: GatewayStatus,
  ): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: externalReference ? { externalReference } : { gatewayPaymentId: gatewayId },
    });
    if (!order) {
      this.logger.warn(
        `Order não encontrado para webhook (ref=${externalReference}, id=${gatewayId})`,
      );
      return;
    }

    order.status = status;
    if (gatewayId) order.gatewayPaymentId = gatewayId;
    await this.orderRepository.save(order);

    if (status === GatewayStatus.APPROVED) {
      await this.checkoutLinkRepository.update(order.checkoutLinkId, {
        status: CheckoutLinkStatus.PAID,
      });
    }
  }

  private async applyWithdrawalUpdate(
    gatewayId: string,
    externalReference: string,
    status: GatewayStatus,
  ): Promise<void> {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: externalReference ? { externalReference } : { gatewayWithdrawalId: gatewayId },
    });
    if (!withdrawal) {
      this.logger.warn(
        `Withdrawal não encontrado para webhook (ref=${externalReference}, id=${gatewayId})`,
      );
      return;
    }

    withdrawal.status = status;
    if (gatewayId) withdrawal.gatewayWithdrawalId = gatewayId;
    await this.withdrawalRepository.save(withdrawal);
  }

  private async mirrorTransaction(
    userId: string,
    type: TransactionType,
    gatewayTransactionId: string,
    externalReference: string,
    status: GatewayStatus,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const amount = typeof payload.amount === 'number' ? payload.amount : 0;

    const transaction = this.transactionRepository.create({
      userId,
      gatewayTransactionId: gatewayTransactionId || undefined,
      type,
      status,
      amountCents: amount,
      externalReference: externalReference || undefined,
      rawPayload: payload,
    });

    await this.transactionRepository.save(transaction);
  }

  async listRegistered(userId: string) {
    return this.gatewayAccountService.withAuth(userId, (token) =>
      this.gatewayHttpService.listWebhooks(token),
    );
  }

  async deleteRegistered(userId: string, gatewayWebhookId: string): Promise<void> {
    await this.gatewayAccountService.withAuth(userId, (token) =>
      this.gatewayHttpService.deleteWebhook(token, gatewayWebhookId),
    );
  }
}
