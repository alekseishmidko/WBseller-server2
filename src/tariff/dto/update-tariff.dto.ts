import { PartialType } from '@nestjs/mapped-types';
import { CreateTariffDto } from './create-tariff.dto';
import { IsNumber, IsString } from 'class-validator';

export class UpdateTariffDto extends PartialType(CreateTariffDto) {
  @IsString()
  name: string;

  @IsNumber()
  count: number;

  @IsNumber()
  price: number;
}
