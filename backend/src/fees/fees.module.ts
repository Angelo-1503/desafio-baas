import { Module } from '@nestjs/common';
import { GatewayClientModule } from '../gateway-client/gateway-client.module';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';

@Module({
  imports: [GatewayClientModule],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
