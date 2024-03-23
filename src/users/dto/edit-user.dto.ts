import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class EditUserInfoDto {
  @MinLength(2, {
    message: 'Name length should be more then 2 symbols',
  })
  @IsString()
  newName: string;
}
export class EditUserPasswordDto {
  @MinLength(6, {
    message: 'Password length should be more then 6 symbols',
  })
  @IsString()
  newPassword: string;
}
