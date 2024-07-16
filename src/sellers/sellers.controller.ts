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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SellersService } from './sellers.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateSellerDto } from './dto/create-seller.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { EditSellerDto } from './dto/edit-seller.dto';

import { Request } from 'express';
import { Seller } from './decorators/seller.decorator';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Auth()
  @HttpCode(200)
  @UsePipes(new ValidationPipe())
  @Post()
  async createUserSeller(
    @Body() dto: CreateSellerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sellersService.createSeller(dto, userId);
  }

  @Auth()
  @Get()
  async getAllUserSellers(@CurrentUser('id') userId: string) {
    return this.sellersService.getAllUserSellers(userId);
  }

  @Auth()
  @Patch()
  @UsePipes(new ValidationPipe())
  async editSeller(
    @Body() dto: EditSellerDto,
    @Query('sellerId') sellerId: string,
  ) {
    return this.sellersService.editSeller(dto, sellerId);
  }

  @Auth()
  @Seller()
  @Delete(':id')
  async deleteSeller(@Param('id') id: string) {
    return this.sellersService.deleteSeller(id);
  }

  @Auth()
  @Seller()
  @Get(':id')
  async getOneUserSeller(
    @Param('id') id: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.sellersService.getOneUserSeller(id, userEmail);
  }
}
