import { Injectable } from '@nestjs/common';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TariffService {
  constructor(private prisma: PrismaService) {}
  async findLastIndex() {
    const lastTariff = await this.prisma.tariff.findFirst({
      orderBy: {
        index: 'desc',
      },
    });

    return lastTariff.index ?? 0;
  }
  async create(dto: CreateTariffDto) {
    const lastIndex = await this.findLastIndex();
    const newTariff = await this.prisma.tariff.create({
      data: {
        ...dto,
        index: lastIndex + 1,
      },
    });

    return newTariff;
  }

  async findAll() {
    return await this.prisma.tariff.findMany({});
  }

  async findOne(index: number) {
    return await this.prisma.tariff.findUnique({ where: { index } });
  }

  async update(index: number, dto: UpdateTariffDto) {
    await this.prisma.tariff.update({ where: { index }, data: { ...dto } });
  }

  async remove(index: number) {
    await this.prisma.tariff.delete({ where: { index } });
  }
}
