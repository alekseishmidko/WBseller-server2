import { IsString } from 'class-validator';

export class BotDto {
  @IsString()
  email: string;
}
export class MessageBotDto {
  @IsString()
  text: string;
}
