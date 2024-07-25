import { BadRequestException, Injectable } from '@nestjs/common';
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
    if (!lastTariff) return 0;

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
    if (!newTariff) return new BadRequestException('Tariff already exist!');
    return newTariff;
  }

  async findAll() {
    return await this.prisma.tariff.findMany({});
  }

  async findOne(index: number) {
    const tariff = await this.prisma.tariff.findUnique({ where: { index } });
    if (!tariff) return new BadRequestException('Tariff dont  exist!');
    return tariff;
  }

  async update(index: number, dto: UpdateTariffDto) {
    const updatedTariff = await this.prisma.tariff.update({
      where: {
        index: index,
      },
      data: {
        ...dto,
        index: index,
      },
    });

    return updatedTariff;
  }

  async remove(index: number) {
    await this.prisma.tariff.delete({ where: { index } });
  }
}
