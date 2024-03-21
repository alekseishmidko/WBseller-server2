import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class AuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @MinLength(6, {
    message: 'Password`s length should be more then 6 symbols',
  })
  @IsString()
  password: string;
}
