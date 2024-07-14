import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Request } from 'express';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UploadReportDto } from './dto/upload-report.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Seller } from 'src/sellers/decorators/seller.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Auth()
  async getAllSellerReports(
    @Req() req: Request,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportsService.getAllSellerReports(req, userId);
  }

  @Get(':id')
  @Auth()
  @Seller()
  async getOneReport(
    @Param('id') id: string,
    @Query('sellerId') sellerId: string,
    @CurrentUser('id')
    userId: string,
  ) {
    return this.reportsService.getOneReport(id, sellerId, userId);
  }

  @Delete(':id')
  @HttpCode(200)
  @Auth()
  @Seller()
  async deleteReport(
    @Param('id') id: string,
    // @Query('sellerId') sellerId: string,
    // @CurrentUser('id') userId: string,
  ) {
    return this.reportsService.deleteReport(id);
  }

  @Post()
  @HttpCode(200)
  @Auth()
  @UsePipes(new ValidationPipe())
  async createReport(
    @Query('sellerId') sellerId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(sellerId, userId, dto);
  }

  @Patch(':id')
  @HttpCode(200)
  @Auth()
  @UsePipes(new ValidationPipe())
  async addAdditionalData(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser('id') userId: string,
    @Query('sellerId') sellerId: string,
  ) {
    return this.reportsService.addAdditionalData(id, dto, userId, sellerId);
  }

  @Post('upload')
  @HttpCode(200)
  @Auth()
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('file'))
  async uploadReport(
    @Req() req: Request,
    @CurrentUser('id') userId: string,
    @Query('sellerId') sellerId: string,
    @Body() dto: UploadReportDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.reportsService.uploadReport(req, userId, sellerId, dto, file);
  }
}
