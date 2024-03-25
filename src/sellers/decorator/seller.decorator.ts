import { UseGuards } from '@nestjs/common';
import { SellerGuard } from '../guard/seller.guard';

export const SellerAuth = () => UseGuards(SellerGuard);
