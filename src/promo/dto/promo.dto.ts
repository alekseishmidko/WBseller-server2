import { IsNumber, IsString } from 'class-validator';

export class PromoDto {
  @IsString()
  promo: string;
}

export class CreatePromoDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  count: number;
}
