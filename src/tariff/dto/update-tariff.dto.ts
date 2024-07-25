import { PartialType } from '@nestjs/mapped-types';
import { CreateTariffDto } from './create-tariff.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTariffDto extends PartialType(CreateTariffDto) {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  count: number;

  @IsOptional()
  @IsNumber()
  price: number;
}
