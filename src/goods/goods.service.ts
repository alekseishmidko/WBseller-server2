import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class GoodsService {
  constructor(private prisma: PrismaService) {}

  async getAllUserGoods(req: Request) {
    // const allGoods = await this.prisma.
  }
  async createGoods() {}
  async createOrUpdateManyGoods() {}
  async changePriceInGoods() {}
  async deleteGoods() {}
}
