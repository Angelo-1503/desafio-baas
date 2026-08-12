import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CheckoutModule } from './checkout/checkout.module';
import { CommonModule } from './common/common.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { validateEnv } from './config/env.validation';
import { FeesModule } from './fees/fees.module';
import { GatewayClientModule } from './gateway-client/gateway-client.module';
import { MailModule } from './mail/mail.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { WalletModule } from './wallet/wallet.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT', 3306),
        username: configService.getOrThrow<string>('DATABASE_USER'),
        password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
        database: configService.getOrThrow<string>('DATABASE_NAME'),
        ssl:
          configService.get<string>('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : undefined,
        autoLoadEntities: true,
        // Sandbox/desafio técnico: sem sistema de migrations dedicado, o schema é
        // sincronizado a partir das entities a cada boot.
        synchronize: true,
      }),
    }),
    CommonModule,
    AuthModule,
    GatewayClientModule,
    FeesModule,
    WalletModule,
    CheckoutModule,
    WithdrawalsModule,
    WebhooksModule,
    ReceiptsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
