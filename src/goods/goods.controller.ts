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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GoodsService } from './goods.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateGoodsDto } from './dto/create-goods.dto';
import { UpdateGoodsDto } from './dto/update-goods.dto';
import { Seller } from 'src/sellers/decorators/seller.decorator';

@Controller('goods')
export class GoodsController {
  constructor(private readonly goodsService: GoodsService) {}

  @Get()
  @Auth()
  async getAllUserGoods(@Query('sellerId') sellerId: string) {
    return this.goodsService.getAllUserGoods(sellerId);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  @Auth()
  @Seller()
  async createGoods(
    @Body() dto: CreateGoodsDto,
    @Query('sellerId') sellerId: string,
  ) {
    return this.goodsService.createGoods(dto, sellerId);
  }

  @Post('many')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Auth()
  async createOrUpdateManyGoods(
    @Body() dto: CreateGoodsDto[],
    @Query('sellerId') sellerId: string,
  ) {
    return this.goodsService.createOrUpdateManyGoods(dto, sellerId);
  }

  @Patch()
  @UsePipes(new ValidationPipe())
  @Auth()
  async changePriceInGoods(@Body() dto: UpdateGoodsDto) {
    return this.goodsService.changePriceInGoods(dto);
  }

  @Delete(':id')
  @Auth()
  async deleteGoods(@Param('id') id: string) {
    return this.goodsService.deleteGoods(id);
  }
}
