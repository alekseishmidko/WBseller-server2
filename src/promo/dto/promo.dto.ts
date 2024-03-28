import { IsString } from 'class-validator';

export class PromoDto {
  @IsString()
  promo: string;
}
