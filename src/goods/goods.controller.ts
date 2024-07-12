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
import { GoodsService } from './goods.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Request } from 'express';
import { CreateGoodsDto } from './dto/create-goods.dto';
import { UpdateGoodsDto } from './dto/update-goods.dto';

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
  async createGoods(@Body() dto: CreateGoodsDto, @Req() req: Request) {
    return this.goodsService.createGoods(dto, req);
  }

  @Post('many')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Auth()
  async createOrUpdateManyGoods(
    @Body() dto: CreateGoodsDto[],
    @Req() req: Request,
  ) {
    return this.goodsService.createOrUpdateManyGoods(dto, req);
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
