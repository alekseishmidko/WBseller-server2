import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { PromoService } from './promo.service';
import { CreatePromoDto, PromoDto } from './dto/promo.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}
  @Post()
  @HttpCode(200)
  async getKeyToActivate(@Body() dto: PromoDto) {
    return this.promoService.checkPromo(dto);
  }

  @Get()
  @HttpCode(200)
  async getAll() {
    return this.promoService.getAll();
  }

  @Post('create') @HttpCode(200) @Auth('admin') async create(
    @Body() dto: CreatePromoDto,
  ) {
    return this.promoService.create(dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @Auth('admin')
  async delete(@Param('id') id: string) {
    return this.promoService.delete(id);
  }
}
