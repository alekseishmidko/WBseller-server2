import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SellerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    console.log(req.query, req.params, req.user);

    //   const userId = req.user._id;
    //   const sellerId = req.query.sellerId || req.params.id;

    //   const seller = await this.prisma.seller.findUnique({
    //     where: {
    //       id: sellerId,
    //     },
    //   });

    //   if (!seller) {
    //     throw new NotFoundException(`Seller not found`);
    //   }

    //   if (seller.userId !== userId) {
    //     throw new BadRequestException(
    //       `Unauthorized! Seller ID does not match the user ID.`,
    //     );
    //   }

    //   req.seller = seller;
    return true;
  }
}
