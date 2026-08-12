import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutLink } from '../checkout/entities/checkout-link.entity';
import { Order } from '../checkout/entities/order.entity';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, CheckoutLink])],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
})
export class ReceiptsModule {}
