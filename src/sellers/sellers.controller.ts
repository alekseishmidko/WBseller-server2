import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateSellerDto } from './dto/create-seller.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Auth()
  @HttpCode(200)
  @Post()
  async createUserSeller(
    @Body() dto: CreateSellerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sellersService.createSeller(dto, userId);
  }
}
