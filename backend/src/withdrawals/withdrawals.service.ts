import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import type { Repository } from 'typeorm';
import { GatewayStatus } from '../common/enums/gateway-status.enum';
import { GatewayAccountService } from '../gateway-client/gateway-account.service';
import { GatewayHttpService } from '../gateway-client/gateway-http.service';
import type { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { Withdrawal } from './entities/withdrawal.entity';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepository: Repository<Withdrawal>,
    private readonly gatewayAccountService: GatewayAccountService,
    private readonly gatewayHttpService: GatewayHttpService,
  ) {}

  async create(userId: string, dto: CreateWithdrawalDto): Promise<Withdrawal> {
    const externalReference = `wd-${nanoid(10)}`;

    const response = await this.gatewayAccountService.withAuth(userId, (token) =>
      this.gatewayHttpService.createWithdrawal(token, {
        amount: dto.amountCents,
        pixKey: dto.pixKey,
        description: dto.description,
        externalReference,
        document: dto.document,
      }),
    );

    const withdrawal = this.withdrawalRepository.create({
      userId,
      amountCents: dto.amountCents,
      pixKey: dto.pixKey,
      description: dto.description,
      document: dto.document,
      externalReference,
      status: response.status as GatewayStatus,
      gatewayWithdrawalId: response.id,
    });

    return this.withdrawalRepository.save(withdrawal);
  }

  async list(userId: string): Promise<Withdrawal[]> {
    return this.withdrawalRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(userId: string, id: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepository.findOne({ where: { id, userId } });
    if (!withdrawal) throw new NotFoundException('Saque não encontrado');

    if (withdrawal.gatewayWithdrawalId && withdrawal.status === GatewayStatus.PENDING) {
      const fresh = await this.gatewayAccountService.withAuth(userId, (token) =>
        this.gatewayHttpService.getWithdrawal(token, withdrawal.gatewayWithdrawalId as string),
      );
      withdrawal.status = fresh.status as GatewayStatus;
      await this.withdrawalRepository.save(withdrawal);
    }

    return withdrawal;
  }
}
