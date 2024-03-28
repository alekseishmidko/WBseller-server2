import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PromoService } from './promo.service';
import { PromoDto } from './dto/promo.dto';

@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}
  @Post()
  @HttpCode(200)
  async getKeyToActivate(@Body() dto: PromoDto) {
    return this.promoService.checkPromo(dto);
  }
}
