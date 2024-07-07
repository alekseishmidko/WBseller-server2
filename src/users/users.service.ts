import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { hash } from 'argon2';
import { AuthDto } from 'src/auth/dto/auth.dto';
import { Request } from 'express';
import { EditUserInfoDto, EditUserPasswordDto } from './dto/edit-user.dto';
import { PeriodType } from 'src/types/report-types';
import { getQuantityOfBalance } from 'src/helpers/balance/balance';
@Injectable()
export class UsersService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async getUserById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(dto: AuthDto) {
    const user = {
      email: dto.email,
      name: dto.name,
      password: await hash(dto.password),
      key: +Date.now(),
      // role: 'user',
      // status: 'disabled',
      // balance: 2,
      // tariff: 'Новый пользователь',
      // chatId: 0,
    };
    return this.prisma.user.create({ data: user });
  }

  async incrementUserBalance(id: string, number: number) {
    await this.prisma.user.update({
      where: { id },
      data: { balance: { increment: number } },
    });
  }
  async decrementUserBalance(
    id: string,
    currentBalance: number,
    period: PeriodType,
  ) {
    const count = getQuantityOfBalance(period.dateFrom, period.dateTo);
    const newBalance = currentBalance - count;
    await this.prisma.user.update({
      where: { id },
      data: { balance: newBalance <= 0 ? 0 : newBalance },
    });
  }

  async updateUserTariff(id: string, newTariffName: string) {
    return this.prisma.user.update({
      where: { id },
      data: { tariff: newTariffName },
    });
  }

  async getCurrent(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = await this.getUserById(id);
    return user;
  }
  async deleteRefreshToken(userId: string) {
    return this.prisma.token.deleteMany({
      where: { userId: userId },
      // select: { user: userId },
    });
  }

  async getAllUsers(req: Request, role: string) {
    if (role !== 'admin') throw new BadRequestException('Not authorised');
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const startIndex = (page - 1) * limit;
    const totalCount = await this.prisma.user.count();
    const totalPages = Math.ceil(totalCount / limit);
    const allUsers = await this.prisma.user.findMany({
      skip: startIndex,
      take: limit,
    });
    return { allUsers, totalPages };
  }

  async changeUserInfo(dto: EditUserInfoDto, id: string) {
    const existUser = await this.getUserById(id);
    if (!existUser) throw new BadRequestException('Dont find a user!');
    await this.prisma.user.update({
      where: { id },
      data: { name: dto.newName },
    });

    return { message: 'User data is successfully updated' };
  }

  async changeUserPassword(dto: EditUserPasswordDto, id: string) {
    const existUser = await this.getUserById(id);
    if (!existUser) throw new BadRequestException('Dont find a user!');

    const hashedPassword = await hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'User password is successfully updated' };
  }

  async deleteUser(id: string, userId: string, role: string) {
    if (role === 'admin' && userId !== id) {
      const deletedUser = await this.prisma.user.delete({ where: { id } });

      if (!deletedUser)
        throw new InternalServerErrorException('Failed to delete user');
      await this.deleteRefreshToken(id);
      // сервисы по удалению отчетов, продавцов и товаров
      return { message: 'User successfully deleted' };
    } else {
      throw new BadRequestException('Unauthorized to delete user');
    }
  }
  async handleStatusUser(id: string, userId: string, role: string) {
    const findUser = await this.prisma.user.findUnique({ where: { id } });
    if (!findUser)
      throw new BadRequestException('dont find user! (handleStatusUser)');
    if (role === 'admin' && userId !== id) {
      await this.prisma.user.update({
        where: { id: id },
        data: { status: findUser.status === 'active' ? 'disabled' : 'active' },
      });
      return { message: 'User status is succesfully updated' };
    } else {
      throw new BadRequestException('Unauthorized to delete user');
    }
  }

  async getActivate(
    req: Request,
    status: string,
    email: string,
    userId: string,
  ) {
    const activate = req.query.activate as string;
    const chatId = +req.query.chatId;
    if (!activate)
      throw new BadRequestException('there is not an activate key');
    if (status !== 'disabled') throw new BadRequestException('not authorised!');

    const decoded = this.jwt.verify(activate, {
      secret: process.env.ACCESS_KEY,
    });
    if (!decoded) throw new BadRequestException('error in decoded');

    if (decoded.email === email) {
      const findUser = await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'active', chatId: chatId },
      });
      if (!findUser)
        throw new BadRequestException(
          'dont find user or error in update user! (getActivate)',
        );

      return { message: 'User status is succesfully updated' };
    }
  }

  async balanceAuth() {}
}
