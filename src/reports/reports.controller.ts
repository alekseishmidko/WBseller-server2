import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Request } from 'express';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

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
}
