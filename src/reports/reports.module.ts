import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaService } from 'src/prisma.service';
import { SellersService } from 'src/sellers/sellers.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getJwtConfig } from 'src/config/jwt.config';
import { GoodsModule } from 'src/goods/goods.module';
import { FirebaseModule } from 'src/utils/firebase/firebase.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
    GoodsModule,
    FirebaseModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService, SellersService],
})
export class ReportsModule {}
