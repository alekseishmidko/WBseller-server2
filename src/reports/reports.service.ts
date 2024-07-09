import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { SellersService } from 'src/sellers/sellers.service';
import { CreateReportDto } from './dto/create-report.dto';
import axios from 'axios';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private sellersService: SellersService,
  ) {}

  async getAllSellerReports(req: Request, userId: string) {
    const sellerId = req.query.sellerId as string;
    const isSeller = await this.sellersService.sellerMiddleware(
      sellerId,
      userId,
    );
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const startIndex = (page - 1) * limit;
    const totalCount = await this.prisma.report.count({ where: { sellerId } });
    const totalPages = Math.ceil(totalCount / limit);
    const allReports = await this.prisma.user.findMany({
      skip: startIndex,
      take: limit,
    });

    if (!allReports) throw new BadRequestException('Dont find a reports!');
    return { allReports, totalPages };
  }

  async getOneReport(id: string, req: Request, userId: string) {
    const sellerId = req.query.sellerId as string;
    const isSeller = await this.sellersService.sellerMiddleware(
      sellerId,
      userId,
    );
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );

    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new BadRequestException('Dont find a report!');

    return report;
  }

  async deleteReport(id: string, req: Request, userId: string) {
    const sellerId = req.query.sellerId as string;
    const isSeller = await this.sellersService.sellerMiddleware(
      sellerId,
      userId,
    );
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );

    const deletedReport = await this.prisma.report.delete({ where: { id } });
    if (!deletedReport) throw new BadRequestException('Dont find a report!');
    return { message: 'Report is successfully deleted' };
  }

  async getReportByDate(sellerId: string, dateFrom: string, dateTo: string) {
    const report = await this.prisma.report.findFirst({
      where: { sellerId, dateFrom, dateTo },
    });
    return !!report;
  }
  async createReport(req: Request, userId: string, dto: CreateReportDto) {
    const sellerId = req.query.sellerId as string;
    const dateTo = dto.dateTo;
    const dateFrom = dto.dateFrom;
    const url = `https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod?dateFrom=${dateFrom}&dateTo=${dateTo}`;

    const isSeller = await this.sellersService.sellerMiddleware(
      sellerId,
      userId,
    );
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );
    const isExistReport = await this.getReportByDate(
      sellerId,
      dateFrom,
      dateTo,
    );
    if (isExistReport)
      throw new BadRequestException(
        'You already have a report for this period!',
      );
    const seller = await this.sellersService.getSellerById(sellerId);
    const wbtokenFromService = seller.sellerWBtoken;
    const sellerPercentOfFee = seller.taxingPercent;

    const response = await axios.get(url, {
      headers: { Authorization: wbtokenFromService },
    });

    const resData = response.data;
    if (!resData) throw new BadGatewayException('WB API is disabled');
    return resData;
  }
}
