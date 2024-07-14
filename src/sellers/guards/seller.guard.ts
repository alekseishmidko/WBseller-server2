import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { SellersService } from '../sellers.service';

@Injectable()
export class OnlySellerGuard implements CanActivate {
  constructor(private readonly sellersService: SellersService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sellerId = request.query.sellerId;
    const userId = request.user.id;

    const seller = await this.sellersService.getSellerById(sellerId);

    if (!seller || seller.userId !== userId) {
      throw new ForbiddenException(
        'Unauthorized! Seller ID does not match the user ID.',
      );
    }

    return true;
  }
}
