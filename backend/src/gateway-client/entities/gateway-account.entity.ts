import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum GatewayAccountStatus {
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  ACTIVE = 'ACTIVE',
}

/**
 * Vínculo seguro com a conta do gateway Lera Box. Criada quando o lojista se cadastra
 * na BaaS (dispara POST /api/users no gateway) e ativada quando ele confirma a senha
 * recebida por e-mail (dispara POST /api/auth/login no gateway).
 */
@Entity('gateway_accounts')
export class GatewayAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(
    () => User,
    (user) => user.gatewayAccount,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  /** CPF ou CNPJ enviado ao gateway — necessário para login (document + password). */
  @Column()
  document: string;

  @Column({
    type: 'enum',
    enum: GatewayAccountStatus,
    default: GatewayAccountStatus.PENDING_ACTIVATION,
  })
  status: GatewayAccountStatus;

  @Column({ nullable: true })
  codigoCliente?: string;

  @Column({ nullable: true })
  chaveLoja?: string;

  /** Criptografado (AES-256-GCM) — necessário para relogin automático quando o token expira. */
  @Column({ type: 'text', nullable: true })
  gatewayPasswordEnc?: string;

  /** Bearer token atual, criptografado em repouso. */
  @Column({ type: 'text', nullable: true })
  bearerTokenEnc?: string;

  /** Secret único usado para validar X-Lera-Box-Signature nos webhooks desta conta. */
  @Column()
  webhookSecret: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
