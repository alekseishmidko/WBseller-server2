import { Module } from '@nestjs/common';
import { TariffService } from './tariff.service';
import { TariffController } from './tariff.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [TariffController],
  providers: [TariffService, PrismaService],
})
export class TariffModule {}
