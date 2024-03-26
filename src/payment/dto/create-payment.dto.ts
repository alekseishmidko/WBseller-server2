import { IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  value: number;
}
