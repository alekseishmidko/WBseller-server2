import { IsNumber, IsString } from 'class-validator';

export class CreateTariffDto {
  @IsString()
  name: string;

  @IsNumber()
  index: number;

  @IsNumber()
  count: number;

  @IsNumber()
  price: number;
}
