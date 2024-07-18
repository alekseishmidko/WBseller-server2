import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateReportDto {
  @IsNumber()
  @IsOptional()
  totalKeeping: number;

  @IsNumber()
  @IsOptional()
  paidAcceptance: number;

  @IsNumber()
  @IsOptional()
  otherDeductions: number;
}

export class EditSelfPriceDto {
  @IsString()
  id: string;

  @IsNumber()
  price: number;

  @IsString()
  ts_name: string;

  @IsString()
  sa_name: string;
}
