import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UserDto {
  @IsEmail()
  email: string;

  @MinLength(5, {
    message: 'password length should be more then 5 symbols',
  })
  @IsString()
  password: string;

  @IsOptional()
  @MinLength(2, {
    message: 'Name length should be more then 2 symbols',
  })
  @IsString()
  name?: string;
}
