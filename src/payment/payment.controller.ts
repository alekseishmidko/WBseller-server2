import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Request } from 'express';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CheckPaymentDto } from './dto/check-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @Auth()
  async getAllUserTransactions(
    @Req() req: Request,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentService.getAllUserTransactions(req, userId);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  @Auth()
  async createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentService.createPayment(dto);
  }

  @Post('check')
  @Auth()
  @UsePipes(new ValidationPipe())
  async checkPayment(
    @Body() dto: CheckPaymentDto,
    @CurrentUser('tariff') userTariff: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentService.checkPayment(dto, userTariff, userId);
  }
}
