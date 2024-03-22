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
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async register() {}

  @Post()
  async logout() {}

  @Get()
  async refresh() {}

  @Get()
  async current() {}

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
