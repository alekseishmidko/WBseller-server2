import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AuthDto } from './dto/auth.dto';
import { hash, verify } from 'argon2';
import { Response } from 'express';
import { PrismaService } from 'src/prisma.service';
@Injectable()
export class AuthService {
  EXPIRE_DAY_REFRESH_TOKEN = 1;
  REFRESH_TOKEN_NAME = 'refreshToken';
  maxAge = 1 * 24 * 60 * 60 * 1000;
  secret = process.env.JWT_SECRET;
  constructor(
    private jwt: JwtService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}
  generateToken(userId: string) {
    const data = { id: userId };
    const accessToken = this.jwt.sign(data, {
      expiresIn: '2h',
      secret: this.secret,
    });
    const refreshToken = this.jwt.sign(data, {
      expiresIn: '7d',
      secret: this.secret,
    });
    return { accessToken, refreshToken };
  }
  addRefreshTokenToResponse(res: Response, refreshToken: string) {
    res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
      maxAge: this.maxAge,
      httpOnly: true,
    });
  }

  // async checkAndSaveRefreshToken(userId: string, refreshToken: string) {
  //   const existingRefreshToken = await this.prisma.token.findUnique({
  //     where: { user: userId },
  //   });

  //   if (existingRefreshToken) {
  //     existingRefreshToken.refreshToken = refreshToken;
  //     return await this.prisma.token.update({
  //       where: { id: existingRefreshToken.id },
  //       data: { refreshToken },
  //     });
  //   } else {
  //     return await this.prisma.token.create({
  //       data: { user: userId, refreshToken: refreshToken },
  //     });
  //   }
  // }

  private async validateUser(dto: AuthDto) {
    const user = await this.usersService.getUserByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    const isValid = await verify(user.password, dto.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');
    return user;
  }
  async login(dto: AuthDto, res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = await this.validateUser(dto);
    const tokens = this.generateToken(user.id);
    const userData = { ...user, accessToken: tokens.accessToken };
    this.addRefreshTokenToResponse(res, tokens.refreshToken);

    return { userData };
  }
  async register(dto: AuthDto, res: Response) {
    const existedUser = await this.usersService.getUserByEmail(dto.email);
    if (existedUser) throw new BadRequestException('user already exist!');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = await this.usersService.createUser(dto);
    const tokens = this.generateToken(user.id);

    const userData = { ...user, accessToken: tokens.accessToken };
    this.addRefreshTokenToResponse(res, tokens.refreshToken);

    return { userData };
  }
}

// removeRefreshTokenFromResponse(res: Response) {
//   res.cookie(this.REFRESH_TOKEN_NAME, '', {
//     httpOnly: true,
//     domain: CLIENT_DOMAIN,
//     maxAge: this.maxAge,
//     // expires: new Date(0),
//     secure: true, // secure if production
//     sameSite: 'none', //lax if production
//   });
// }

// async generateNewTokens(refreshToken: string) {
//   const result = await this.jwt.verifyAsync(refreshToken);
//   if (!result) throw new ForbiddenException('Invalid refresh token');
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const { password, ...user } = await this.userService.getUserById(result.id);
//   const tokens = this.generateToken(user.id);
//   return { user, ...tokens };
// }
