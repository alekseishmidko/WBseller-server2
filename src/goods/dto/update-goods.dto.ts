import { IsNumber, IsString } from 'class-validator';

export class UpdateGoodsDto {
  @IsString()
  id: string;

  @IsNumber()
  newPrice: number;

  @IsString()
  newTsName: string;
}
