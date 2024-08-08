import {
  BadRequestException,
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
import { CreateReportDto } from './dto/create-report.dto';
import { EditSelfPriceDto, UpdateReportDto } from './dto/update-report.dto';
// import { UploadReportDto } from './dto/upload-report.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Seller } from 'src/sellers/decorators/seller.decorator';
// import { Balance } from 'src/auth/decorators/balance.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

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
    @CurrentUser('balance') currentBalance: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportsService.createReport(
      sellerId,
      dto,
      currentBalance,
      userId,
    );
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
  // @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('file'))
  async uploadReport(
    @Req() req: Request,
    @Query('sellerId') sellerId: string,
    @Query('dateTo') dateTo: string,
    @Query('dateFrom') dateFrom: string,
    // @Body() dto: UploadReportDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('balance') currentBalance: number,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException(`File is required!`);
    return this.reportsService.uploadReport(
      req,
      sellerId,
      // dto,
      dateTo,
      dateFrom,

      file,
      currentBalance,
      userId,
    );
  }

  @Patch()
  @Auth()
  @Seller()
  @UsePipes(new ValidationPipe())
  async editSelfPriceOfUnitInReport(@Body() dto: EditSelfPriceDto) {
    return this.reportsService.editSelfPriceOfUnitInReport(dto);
  }
}
