import { TaxCategories } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class EditSellerDto {
  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: 'Name length should be more then 2 symbols',
  })
  sellerName?: string;

  @IsOptional()
  @IsString()
  sellerWBtoken?: string;

  // @IsString()
  // taxingType: string;
  @IsOptional()
  @IsEnum(TaxCategories)
  taxingType?: TaxCategories;

  @IsOptional()
  @IsNumber()
  taxingPercent?: number;
}
