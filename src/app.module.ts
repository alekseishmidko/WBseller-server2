import { Module } from '@nestjs/common';

import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SellersModule } from './sellers/sellers.module';
import { GoodsModule } from './goods/goods.module';
import { PaymentModule } from './payment/payment.module';
import { BotModule } from './bot/bot.module';
import { PromoModule } from './promo/promo.module';
import { FirebaseModule } from './utils/firebase/firebase.module';
import { ReportsModule } from './reports/reports.module';
import { TariffModule } from './tariff/tariff.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    SellersModule,
    GoodsModule,
    PaymentModule,
    BotModule,
    PromoModule,
    FirebaseModule,
    ReportsModule,
    TariffModule,
  ],
})
export class AppModule {}
