import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AuthDto } from './dto/auth.dto';
import { verify } from 'argon2';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma.service';
@Injectable()
export class AuthService {
  EXPIRE_DAY_REFRESH_TOKEN = 1;
  REFRESH_TOKEN_NAME = 'refreshToken';
  maxAge = 7 * 24 * 60 * 60 * 1000;
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
      // domain: CLIENT_DOMAIN,
      //     secure: true, // secure if production
      //     sameSite: 'none', //lax if production
    });
  }

  async checkAndSaveRefreshToken(userId: string, refreshToken: string) {
    const existingRefreshToken = await this.prisma.token.findFirst({
      where: { user: userId },
    });

    if (existingRefreshToken) {
      existingRefreshToken.refreshToken = refreshToken;
      return await this.prisma.token.update({
        where: { id: existingRefreshToken.id },
        data: { refreshToken },
      });
    } else {
      return await this.prisma.token.create({
        data: { user: userId, refreshToken: refreshToken },
      });
    }
  }

  private async validateUser(dto: AuthDto) {
    const user = await this.usersService.getUserByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    const isValid = await verify(user.password, dto.password);
    if (!isValid) throw new BadRequestException('uncorrect login or password ');

    return user;
  }
  async login(dto: AuthDto, res: Response) {
    const user = await this.validateUser(dto);
    delete user.password;
    const tokens = this.generateToken(user.id);
    await this.checkAndSaveRefreshToken(user.id, tokens.refreshToken);
    const userData = { ...user, accessToken: tokens.accessToken };
    this.addRefreshTokenToResponse(res, tokens.refreshToken);

    return { userData };
  }
  async register(dto: AuthDto, res: Response) {
    const existedUser = await this.usersService.getUserByEmail(dto.email);
    if (existedUser) throw new BadRequestException('email is exiting yet!');
    const user = await this.usersService.createUser(dto);
    delete user.password;
    const tokens = this.generateToken(user.id);
    await this.checkAndSaveRefreshToken(user.id, tokens.refreshToken);
    const userData = { user, accessToken: tokens.accessToken };

    this.addRefreshTokenToResponse(res, tokens.refreshToken);

    return { userData };
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.cookies;
    if (!refreshToken)
      throw new UnauthorizedException('uncorrect login or password (refresh)');

    const verifyUserId = this.jwt.verify(refreshToken, {
      secret: this.secret,
    });

    const tokenFromDB = await this.prisma.token.findFirst({
      where: { refreshToken },
    });
    if (!verifyUserId || !tokenFromDB)
      throw new UnauthorizedException('Something wrong (refresh)!');

    const user = await this.prisma.user.findUnique({
      where: { id: verifyUserId.id },
    });

    const tokens = this.generateToken(user.id);
    await this.checkAndSaveRefreshToken(user.id, tokens.refreshToken);

    const userData = { ...user, accessToken: tokens.accessToken };
    delete userData.password;
    this.addRefreshTokenToResponse(res, tokens.refreshToken);
    return { userData };
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.cookies;
    const token = await this.prisma.token.deleteMany({
      where: { refreshToken: refreshToken },
    });

    res.clearCookie(this.REFRESH_TOKEN_NAME);
    return token;
  }
}
