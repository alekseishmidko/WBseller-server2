import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { CreateSellerDto } from './dto/create-seller.dto';

@Injectable()
export class SellersService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

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
}
