import { IsNumber, IsString } from 'class-validator';

export class CreateGoodsDto {
  @IsString()
  sa_name: string;

  @IsNumber()
  price: number;

  @IsString()
  ts_name: string;
}
