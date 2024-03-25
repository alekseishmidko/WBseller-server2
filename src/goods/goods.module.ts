import { Module } from '@nestjs/common';
import { GoodsService } from './goods.service';
import { GoodsController } from './goods.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [GoodsController],
  providers: [GoodsService, PrismaService],
  exports: [GoodsService],
})
export class GoodsModule {}
