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
  @Seller()
  async getAllSellerReports(
    @Query('sellerId') sellerId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.reportsService.getAllSellerReports(sellerId, page, limit);
  }

  @Get(':id')
  @Auth()
  @Seller()
  async getOneReport(@Param('id') id: string) {
    return this.reportsService.getOneReport(id);
  }

  @Delete(':id')
  @HttpCode(200)
  @Auth()
  @Seller()
  async deleteReport(@Param('id') id: string) {
    return this.reportsService.deleteReport(id);
  }

  @Post()
  @HttpCode(200)
  @Auth()
  @Seller()
  @UsePipes(new ValidationPipe())
  async createReport(
    @Query('sellerId') sellerId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(sellerId, dto);
  }

  @Patch(':id')
  @HttpCode(200)
  @Auth()
  @Seller()
  @UsePipes(new ValidationPipe())
  async addAdditionalData(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reportsService.addAdditionalData(id, dto);
  }

  @Post('upload')
  @HttpCode(200)
  @Auth()
  @Seller()
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('file'))
  async uploadReport(
    @Req() req: Request,
    @Query('sellerId') sellerId: string,
    @Body() dto: UploadReportDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.reportsService.uploadReport(req, sellerId, dto, file);
  }
}
