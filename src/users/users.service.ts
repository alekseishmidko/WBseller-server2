import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from './dto/users.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'schemas/users.schema';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    private jwt: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}
  private generateToken(userId: string) {
    const data = { id: userId };
    const accessToken = this.jwt.sign(data, { expiresIn: '1h' });
    const refreshToken = this.jwt.sign(data, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async login(dto: UserDto) {}
}
