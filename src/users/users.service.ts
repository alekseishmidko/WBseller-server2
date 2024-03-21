import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from './dto/users.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}
  private generateToken(userId: string) {
    const data = { id: userId };
    const accessToken = this.jwt.sign(data, { expiresIn: '1h' });
    const refreshToken = this.jwt.sign(data, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

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

  async login(dto: UserDto) {
    const user = await this.prisma.user.count();
    // .user.findOne({ email: dto.email });

    return user;
  }
  async createUser(dto: UserDto) {
    const user = await this.prisma.user.create({});
    // .user.findOne({ email: dto.email });

    return user;
  }
}
