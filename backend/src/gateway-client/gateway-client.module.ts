import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayAccount } from './entities/gateway-account.entity';
import { GatewayAccountService } from './gateway-account.service';
import { GatewayHttpService } from './gateway-http.service';

@Module({
  imports: [TypeOrmModule.forFeature([GatewayAccount]), HttpModule.register({ timeout: 15000 })],
  providers: [GatewayHttpService, GatewayAccountService],
  exports: [GatewayHttpService, GatewayAccountService],
})
export class GatewayClientModule {}
