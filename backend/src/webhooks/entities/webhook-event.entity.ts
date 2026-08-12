import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum WebhookEventType {
  PAYMENT_PIX = 'PAYMENT_PIX',
  PAYMENT_CARD = 'PAYMENT_CARD',
  WITHDRAWAL = 'WITHDRAWAL',
}

/** Auditoria de todo webhook recebido do gateway, usada também para garantir idempotência. */
@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: WebhookEventType })
  event: WebhookEventType;

  @Column()
  gatewayAccountId: string;

  /** Chave de idempotência derivada do payload (ex: gatewayPaymentId + status). */
  @Column({ unique: true })
  idempotencyKey: string;

  @Column({ default: false })
  signatureValid: boolean;

  @Column({ type: 'json' })
  rawPayload: unknown;

  @Column({ default: false })
  processed: boolean;

  @Column({ type: 'text', nullable: true })
  processingError?: string;

  @CreateDateColumn()
  receivedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  processedAt?: Date;
}
