import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayClientModule } from '../gateway-client/gateway-client.module';
import { Withdrawal } from './entities/withdrawal.entity';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [TypeOrmModule.forFeature([Withdrawal]), GatewayClientModule],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule {}
