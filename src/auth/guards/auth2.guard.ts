import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class Auth2 implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authorizationHeader = req.headers.authorization;
    const token = authorizationHeader.includes('Bearer')
      ? authorizationHeader.split(' ')[1]
      : authorizationHeader;

    const decoded = this.jwt.verify(token, { secret: process.env.JWT_SECRET });

    const user = await this.usersService.getUserById(decoded.id);
    req.user = user;

    return true;
  }
}
