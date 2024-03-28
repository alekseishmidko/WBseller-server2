import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
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
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.sellersService.editSeller(dto, userId, req);
  }

  @Auth()
  @Delete(':id')
  async deleteSeller(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.sellersService.deleteSeller(id, userId, req);
  }

  @Auth()
  @Get(':id')
  async getOneUserSeller(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.sellersService.getOneUserSeller(id, userId, req, userEmail);
  }
}
