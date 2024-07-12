import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateGoodsDto {
  @IsString()
  id: string;

  @IsNumber()
  @IsOptional()
  newPrice: number;

  @IsOptional()
  @IsString()
  newTsName: string;
}
