import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { CreateGoodsDto } from './dto/create-goods.dto';
import { UpdateGoodsDto } from './dto/update-goods.dto';
import { Good } from '@prisma/client';

@Injectable()
export class GoodsService {
  constructor(private prisma: PrismaService) {}
  async findExistingGood(dto: CreateGoodsDto, sellerId: string) {
    return this.prisma.good.findFirst({
      where: { sellerId, sa_name: dto.sa_name, ts_name: dto.ts_name },
    });
  }

  async create(dto: CreateGoodsDto, sellerId: string): Promise<Good> {
    return this.prisma.good.create({
      data: {
        sellerId,
        price: dto.price ? dto.price : 0,
        sa_name: dto.sa_name,
        ts_name: dto.ts_name ? dto.ts_name : '0',
      },
    });
  }

  async getAllUserGoods(sellerId: string): Promise<Good[]> {
    const allGoods = await this.prisma.good.findMany({ where: { sellerId } });
    if (!allGoods) throw new BadRequestException('Dont find a goods!');

    return allGoods;
  }
  async createGoods(dto: CreateGoodsDto, req: Request) {
    const sellerId = req.query.sellerId as string;
    const existingGood = await this.findExistingGood(dto, sellerId);
    if (existingGood)
      throw new BadRequestException(
        'You have already left a info for this product!',
      );
    const newGood = await this.create(dto, sellerId);
    if (!newGood) throw new BadRequestException('Error in creating newGood');

    return { message: 'Product is created!' };
  }

  async createOrUpdateManyGoods(dto: CreateGoodsDto[], req: Request) {
    const sellerId = req.query.sellerId as string;

    for (const good of dto) {
      const existingGood = await this.findExistingGood(good, sellerId);
      if (existingGood) {
        await this.prisma.good.update({
          where: { id: existingGood.id },
          data: {
            price: good.price ? good.price : 0,
          },
        });
      } else {
        await this.create(good, sellerId);
      }
    }
  }

  async changePriceInGoods(dto: UpdateGoodsDto) {
    const updatedGood = await this.prisma.good.update({
      where: { id: dto.id },
      data: { price: dto.newPrice, ts_name: dto.newTsName },
    });
    if (!updatedGood) {
      throw new NotFoundException('Failed to update goods price!');
    }
    return { message: 'Good is successfully updated' };
  }

  async deleteGoods(id: string) {
    const deletedGood = await this.prisma.good.delete({ where: { id } });
    if (!deletedGood) throw new BadRequestException('Failed to delete goods!');
    return { message: 'Good is successfully deleted!' };
  }
}
