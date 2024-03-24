import { TaxCategories } from '@prisma/client';
import { IsEnum, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateSellerDto {
  @IsString()
  @MinLength(2, {
    message: 'Name length should be more then 2 symbols',
  })
  sellerName: string;

  @IsString()
  sellerWBtoken: string;

  // @IsString()
  // taxingType: string;

  @IsEnum(TaxCategories)
  taxingType: TaxCategories;

  @IsNumber()
  taxingPercent: number;
}
