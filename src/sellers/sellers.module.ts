import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { getJwtConfig } from 'src/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
  ],
  controllers: [SellersController],
  providers: [SellersService, PrismaService, UsersService],
  exports: [SellersService],
})
export class SellersModule {}
