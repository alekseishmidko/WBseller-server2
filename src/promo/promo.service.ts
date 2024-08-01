import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreatePromoDto, PromoDto } from './dto/promo.dto';

import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PromoService {
  constructor(private readonly prisma: PrismaService) {}
  async checkPromo(dto: PromoDto) {
    const promos = await this.getAll();
    const promo = promos.find((item) => {
      return item.name === dto.promo;
    });
    if (!promo) {
      throw new HttpException('Dont find a Promo', HttpStatus.CREATED);
    }
    return { message: promo.description };
  }

  async getAll() {
    return await this.prisma.promo.findMany({});
  }

  async create(dto: CreatePromoDto) {
    const existPromo = await this.prisma.promo.findUnique({
      where: { name: dto.name },
    });
    if (existPromo) throw new BadRequestException('You have already a promo !');

    const newPromo = await this.prisma.promo.create({ data: { ...dto } });
    if (!newPromo) throw new BadRequestException('Error in creating promo');

    return { message: 'promo is created!' };
  }

  async delete(id: string) {
    return await this.prisma.promo.delete({ where: { id } });
  }
}
