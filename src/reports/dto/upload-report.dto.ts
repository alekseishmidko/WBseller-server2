import { IsNotEmpty, IsString } from 'class-validator';

export class UploadReportDto {
  @IsNotEmpty()
  @IsString()
  dateFrom: string;

  @IsNotEmpty()
  @IsString()
  dateTo: string;
}
