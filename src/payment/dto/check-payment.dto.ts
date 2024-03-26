import { IsOptional, IsString } from 'class-validator';

export class CheckPaymentDto {
  @IsString()
  paymentId: string;

  @IsString()
  @IsOptional()
  promo?: string;
}
