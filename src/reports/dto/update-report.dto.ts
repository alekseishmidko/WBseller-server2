import { IsNumber, IsOptional } from 'class-validator';

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
