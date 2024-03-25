import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { GoodsService } from './goods.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Request } from 'express';
import { CreateGoodsDto } from './dto/create-goods.dto';

@Controller('goods')
export class GoodsController {
  constructor(private readonly goodsService: GoodsService) {}

  // @Get()
  // @Auth()
  // async getAllUserGoods(@Req() req: Request) {
  //   return this.goodsService.getAllUserGoods(req);
  // }

  // @Post()
  // @Auth()
  // async createGoods(@Body() dto: CreateGoodsDto, @Req() req: Request) {
  //   return this.goodsService.createGoods(dto, req);
  // }

  // @Post('many')
  // @Auth()
  // async createOrUpdateManyGoods() {
  //   return this.goodsService.createOrUpdateManyGoods();
  // }

  // @Patch()
  // @Auth()
  // async changePriceInGoods() {
  //   return this.goodsService.changePriceInGoods();
  // }

  // @Delete(':id')
  // @Auth()
  // async deleteGoods() {
  //   return this.goodsService.deleteGoods();
  // }
}
