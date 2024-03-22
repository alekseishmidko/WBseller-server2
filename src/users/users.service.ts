import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from './dto/users.dto';
import { PrismaService } from 'src/prisma.service';
import { hash } from 'argon2';
import { AuthDto } from 'src/auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
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
}
