import {
  BadGatewayException,
  BadRequestException,
  Injectable,
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

  async sellerMiddleware(sellerId: string, userId: string) {
    const seller = await this.getSellerById(sellerId);
    if (!seller) return false;
    if (seller.userId !== userId) return false;
    return true;
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
    const sellerId = req.query.sellerId as string; // || req.params;
    const isSeller = await this.sellerMiddleware(sellerId, userId);

    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );

    const updatedSeller = await this.prisma.seller.update({
      where: { id: sellerId },
      data: { ...dto },
    });

    if (!updatedSeller)
      throw new BadGatewayException('Failed to update seller info!');
    return { message: 'Seller is successfully updated' };
  }
  async deleteSeller(id: string, userId: string, req: Request) {
    const sellerId = req.query.sellerId as string; // || req.params;
    const isSeller = await this.sellerMiddleware(sellerId, userId);
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );

    const deletedSeller = await this.prisma.seller.delete({ where: { id } });
    if (!deletedSeller)
      throw new BadGatewayException('Failed to delete seller!');
    return { message: 'Seller is successfully deleted!' };
  }
  async getOneUserSeller(
    id: string,
    userId: string,
    req: Request,
    userEmail: string,
  ) {
    const sellerId = req.query.sellerId as string; // || req.params;
    const isSeller = await this.sellerMiddleware(sellerId, userId);
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );

    const seller = await this.getSellerById(id);
    if (!seller) throw new BadRequestException('Dont find a seller!');

    return { seller, masterEmail: userEmail };
  }
}
