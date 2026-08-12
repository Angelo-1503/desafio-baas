import { Module } from '@nestjs/common';
import { GatewayClientModule } from '../gateway-client/gateway-client.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [GatewayClientModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
