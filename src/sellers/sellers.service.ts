import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { EditSellerDto } from './dto/edit-seller.dto';
import { Request } from 'express';
@Injectable()
export class SellersService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async sellerMiddleware(req: Request, userId: string) {
    // console.log(req.query, req.params, userId);

    const sellerId = req.query.sellerId as string; // || req.params;
    const seller = await this.getSellerById(sellerId);
    if (!seller) throw new BadRequestException(`Dont find a seller!`);
    // console.log(seller);
  }
  async getSellerById(id: string) {
    return await this.prisma.seller.findUnique({ where: { id } });
  }
  async createSeller(dto: CreateSellerDto, userId: string) {
    const existingSeller = await this.prisma.seller.findFirst({
      where: { id: userId, sellerName: dto.sellerName },
    });
    if (existingSeller)
      throw new BadRequestException(
        `You have already a Seller with name: ${dto.sellerName}`,
      );

    const countSellersByUser = await this.prisma.seller.count({
      where: { userId },
    });
    // Тут мб сервис по определению доступного количества поставщиков у одного юзера
    if (countSellersByUser >= 2)
      throw new BadRequestException(
        `You dont have quantity of sellers more then 2`,
      );
    await this.prisma.seller.create({
      data: {
        userId,
        sellerName: dto.sellerName,
        sellerWBtoken: dto.sellerWBtoken,
        taxingPercent: dto.taxingPercent,
        taxingType: dto.taxingType,
      },
    });

    return { message: 'Seller is created!' };
  }

  async getAllUserSellers(userId: string) {
    const allSellers = await this.prisma.seller.findMany({
      where: { userId },
    });
    if (!allSellers) throw new BadRequestException(` Dont find a sellers!`);

    return allSellers;
  }

  async editSeller(dto: EditSellerDto, userId: string, req: Request) {
    this.sellerMiddleware(req, userId);
  }
  async deleteSeller(id: string) {}
  async getOneUserSeller(id: string) {}
}
