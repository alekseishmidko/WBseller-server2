import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request } from 'express';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { EditUserInfoDto, EditUserPasswordDto } from './dto/edit-user.dto';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(200)
  @Auth()
  @Get('current')
  async current(@CurrentUser('id') id: string) {
    return this.usersService.getCurrent(id);
  }

  @Get()
  @Auth()
  async getAllUsers(@Req() req: Request, @CurrentUser('role') role: string) {
    return this.usersService.getAllUsers(req, role);
  }

  @HttpCode(200)
  @UsePipes(new ValidationPipe())
  @Post('edit')
  @Auth()
  async changeUserInfo(
    @Body() dto: EditUserInfoDto,
    @CurrentUser('id') id: string,
  ) {
    return this.usersService.changeUserInfo(dto, id);
  }

  @Post()
  @HttpCode(200)
  @UsePipes(new ValidationPipe())
  @Auth()
  async changeUserPassword(
    @Body() dto: EditUserPasswordDto,
    @CurrentUser('id') id: string,
  ) {
    return this.usersService.changeUserPassword(dto, id);
  }

  @HttpCode(200)
  @Auth()
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.usersService.deleteUser(id, userId, role);
  }

  @HttpCode(200)
  @Auth()
  @Patch(':id')
  async handleStatusUser(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.usersService.handleStatusUser(id, userId, role);
  }

  @HttpCode(200)
  @Auth()
  @Get('activate')
  async activate(
    @Req() req: Request,
    @CurrentUser('status') status: string,
    @CurrentUser('email') email: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.getActivate(req, status, email, userId);
  }
}
