import { UseGuards } from '@nestjs/common';
import { OnlySellerGuard } from '../guards/seller.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

export function Seller() {
  return UseGuards(JwtAuthGuard, OnlySellerGuard);
}
