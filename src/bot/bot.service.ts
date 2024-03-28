import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { BotDto, MessageBotDto } from './dto/bot.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

@Injectable()
export class BotService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private userService: UsersService,
  ) {}
  forbiddenText = [
    'Активировать аккаунт',
    'Пользователь с данным email не найден, проверьте правильность набранного адреса почты',
  ];
  url = `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`;

  async getKeyToActivate(dto: BotDto) {
    if (
      dto.email === this.forbiddenText[0] &&
      dto.email === this.forbiddenText[1]
    ) {
      throw new BadRequestException('forbidden words!');
    }

    const existedUser = await this.userService.getUserByEmail(dto.email);
    if (existedUser === null || existedUser.status === 'active') {
      return false;
    }
    const activateKey = this.jwt.sign(
      { email: dto.email },
      { secret: process.env.ACCESS_KEY, expiresIn: '5m' },
    );
    return activateKey;
  }

  async sendMessageToBot(dto: MessageBotDto, userRole: string) {
    if (userRole !== 'admin') throw new BadRequestException('Not authorised');
    const userChatIdsArr = await this.prisma.user
      .findMany({
        where: {
          chatId: {
            not: 0, // Исключаем chatId равные 0
          },
        },
        select: {
          chatId: true, // Выбираем только атрибут chatId
        },
      })
      .then((users) => users.map((user) => user.chatId));

    for (const chatId of userChatIdsArr) {
      try {
        await this.sendToAllUsersInChat(chatId, dto.text);
      } catch (error) {
        console.error(`Error sending message to chat ${chatId}:`, error);
      }
    }
    return { message: 'Send' };
  }

  async sendToAllUsersInChat(chatId: number, text: string) {
    const { data } = await axios.post(this.url, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      //   reply_markup: {
      //     inline_keyboard: [
      //       [
      //         {
      //           text: "Посмотреть отчет",
      //           url: process.env.CLIENT_URL,
      //         },
      //       ],
      //     ],
      //   }, // при деплое разкоммитить
    });
    return data;
  }
}
