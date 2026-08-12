import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutLink } from '../checkout/entities/checkout-link.entity';
import { Order } from '../checkout/entities/order.entity';
import { GatewayAccount } from '../gateway-client/entities/gateway-account.entity';
import { GatewayClientModule } from '../gateway-client/gateway-client.module';
import { Transaction } from '../wallet/entities/transaction.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookEvent,
      GatewayAccount,
      Order,
      CheckoutLink,
      Withdrawal,
      Transaction,
    ]),
    GatewayClientModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
