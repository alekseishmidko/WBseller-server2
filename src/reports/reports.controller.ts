import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Request } from 'express';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { CreateReportDto } from './dto/create-report.dto';

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
  async getOneReport(
    @Param('id') id: string,
    @Req() req: Request,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportsService.getOneReport(id, req, userId);
  }

  @Delete(':id')
  @HttpCode(200)
  @Auth()
  async deleteReport(
    @Param('id') id: string,
    @Req() req: Request,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportsService.deleteReport(id, req, userId);
  }

  @Post()
  @HttpCode(200)
  @Auth()
  async createReport(
    @Req() req: Request,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(req, userId, dto);
  }
}
