import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/users.dto';
import { Request, Response } from 'express';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(200)
  @Auth()
  @Get('current')
  async current(@CurrentUser('id') id: string) {
    return this.usersService.getCurrent(id);
  }

  @Post()
  async logout() {}

  @Get()
  async refresh() {}

  @Get()
  async getAllUsers() {}

  @Post()
  async editUser() {}

  @Post()
  async changeUserPassword() {}

  @Delete()
  async delete() {}

  @Patch()
  async handleStatusUser() {}

  @Get()
  async activate() {}
}
