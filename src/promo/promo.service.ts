import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PromoDto } from './dto/promo.dto';
import { promos } from 'src/helpers/promo/promo';

@Injectable()
export class PromoService {
  async checkPromo(dto: PromoDto) {
    const promo = promos.find((item) => {
      return item.name === dto.promo;
    });
    if (!promo) {
      throw new HttpException('Dont find a Promo', HttpStatus.CREATED);
    }
    return { message: promo.description };
  }
}
