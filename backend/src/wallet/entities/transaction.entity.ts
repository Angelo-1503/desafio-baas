import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GatewayStatus } from '../../common/enums/gateway-status.enum';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  WITHDRAWAL = 'WITHDRAWAL',
}

/**
 * Espelho local do extrato do gateway (GET /api/wallet/transactions), usado para
 * conciliação por externalReference sem precisar consultar o gateway a cada listagem.
 */
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  gatewayTransactionId?: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: GatewayStatus })
  status: GatewayStatus;

  @Column({ type: 'int' })
  amountCents: number;

  @Column({ nullable: true })
  externalReference?: string;

  @Column({ type: 'json', nullable: true })
  rawPayload?: unknown;

  @CreateDateColumn()
  syncedAt: Date;
}
