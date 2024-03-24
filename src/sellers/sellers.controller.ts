import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SellersService } from './sellers.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateSellerDto } from './dto/create-seller.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { EditSellerDto } from './dto/edit-seller.dto';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Auth()
  @HttpCode(200)
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
  // SellerAuth
  async editSeller(
    @Body() dto: EditSellerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sellersService.editSeller(dto, userId);
  }

  @Auth()
  @Delete(':id')
  // SellerAuth
  async deleteSeller(@Param('id') id: string) {
    return this.sellersService.deleteSeller(id);
  }

  @Auth()
  @Get(':id')
  // SellerAuth
  async getOneUserSeller(
    @Param('id') id: string,
    // @CurrentUser('id') userId: string,
  ) {
    return this.sellersService.getOneUserSeller(id);
  }
}
