import { IsDate, IsString } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsDate()
  dateTo: string;

  @IsString()
  @IsDate()
  dateFrom: string;
}
