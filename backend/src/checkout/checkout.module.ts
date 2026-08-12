import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesModule } from '../fees/fees.module';
import { GatewayClientModule } from '../gateway-client/gateway-client.module';
import { MailModule } from '../mail/mail.module';
import { CheckoutPublicController } from './checkout-public.controller';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutLink } from './entities/checkout-link.entity';
import { Order } from './entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutLink, Order]),
    GatewayClientModule,
    FeesModule,
    MailModule,
  ],
  controllers: [CheckoutController, CheckoutPublicController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
