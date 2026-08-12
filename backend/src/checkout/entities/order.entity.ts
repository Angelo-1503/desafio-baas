import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GatewayStatus } from '../../common/enums/gateway-status.enum';
import { CardBrand, PaymentMethod } from '../../common/enums/payment-method.enum';
import { CheckoutLink } from './checkout-link.entity';

/**
 * Pedido de pagamento efetivo, criado quando o pagador escolhe Pix ou Cartão
 * na página pública de um checkout link. Espelha o pagamento no gateway Lera Box.
 */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => CheckoutLink,
    (checkoutLink) => checkoutLink.orders,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'checkoutLinkId' })
  checkoutLink: CheckoutLink;

  @Column()
  checkoutLinkId: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: GatewayStatus, default: GatewayStatus.PENDING })
  status: GatewayStatus;

  @Column({ type: 'int' })
  amountCents: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  feePercent?: string;

  @Column({ type: 'int', nullable: true })
  feeAmountCents?: number;

  @Column({ type: 'int', nullable: true })
  netAmountCents?: number;

  @Column({ nullable: true, type: 'enum', enum: CardBrand })
  brand?: CardBrand;

  @Column({ type: 'int', nullable: true })
  installments?: number;

  @Column({ nullable: true })
  cardLast4?: string;

  /** Referência própria enviada ao gateway como externalReference — usada na conciliação. */
  @Index({ unique: true })
  @Column()
  externalReference: string;

  /** ID do pagamento retornado pelo gateway (GET /api/payments/:id). */
  @Column({ nullable: true })
  gatewayPaymentId?: string;

  @Column({ nullable: true })
  payerDocument?: string;

  @Column({ type: 'text', nullable: true })
  qrCodeBase64?: string;

  @Column({ type: 'text', nullable: true })
  emv?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
