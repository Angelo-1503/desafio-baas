import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GatewayStatus } from '../../common/enums/gateway-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  amountCents: number;

  @Column()
  pixKey: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  externalReference: string;

  @Column()
  document: string;

  @Column({ type: 'enum', enum: GatewayStatus, default: GatewayStatus.PENDING })
  status: GatewayStatus;

  @Column({ nullable: true })
  gatewayWithdrawalId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
