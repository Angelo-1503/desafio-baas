import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CardBrand, PaymentMethod } from '../../common/enums/payment-method.enum';
import { User } from '../../users/entities/user.entity';
import { Order } from './order.entity';

export enum CheckoutLinkStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * Link/sessão de checkout criado pelo lojista. Referência conciliável no gateway:
 * cada Order gerado a partir deste link usa `checkoutLink.id` como base do externalReference.
 */
@Entity('checkout_links')
export class CheckoutLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  amountCents: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'simple-array' })
  allowedMethods: PaymentMethod[];

  @Column({
    type: 'enum',
    enum: CheckoutLinkStatus,
    default: CheckoutLinkStatus.ACTIVE,
  })
  status: CheckoutLinkStatus;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  /**
   * Taxa de cartão consultada e travada no momento da criação do link (quando CARD está
   * entre os métodos aceitos). O pagador só informa os dados do cartão — bandeira,
   * parcelas e taxa já foram definidas pelo lojista e não são reabertas na hora do pagamento.
   */
  @Column({ nullable: true, type: 'enum', enum: ['VISA', 'MASTERCARD', 'ELO'] })
  cardBrand?: CardBrand;

  @Column({ type: 'int', nullable: true })
  cardInstallments?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cardFeePercent?: string;

  @OneToMany(
    () => Order,
    (order) => order.checkoutLink,
  )
  orders?: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
