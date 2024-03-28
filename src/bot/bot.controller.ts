import {
  Body,
  Controller,
  HttpCode,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BotService } from './bot.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { BotDto, MessageBotDto } from './dto/bot.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async getKeyToActivate(@Body() dto: BotDto) {
    return this.botService.getKeyToActivate(dto);
  }

  @Put()
  @HttpCode(200)
  @UsePipes(new ValidationPipe())
  @Auth()
  async sendMessageToBot(
    @Body() dto: MessageBotDto,
    @CurrentUser('role') userRole: string,
  ) {
    return this.botService.sendMessageToBot(dto, userRole);
  }
}
