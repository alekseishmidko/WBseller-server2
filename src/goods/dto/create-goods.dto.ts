import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGoodsDto {
  @IsString()
  sa_name: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  ts_name?: string;
}
