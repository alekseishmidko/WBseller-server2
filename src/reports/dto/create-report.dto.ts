import { IsString } from 'class-validator';
import { IsCustomDateString } from './custom-date-validator/custom-date.validator';

export class CreateReportDto {
  @IsString()
  @IsCustomDateString()
  dateTo: string;

  @IsString()
  @IsCustomDateString()
  dateFrom: string;
}
