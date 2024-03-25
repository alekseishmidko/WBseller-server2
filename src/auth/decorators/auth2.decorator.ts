import { UseGuards } from '@nestjs/common';
import { Auth2 } from '../guards/auth2.guard';

export const Auth2Guard = () => UseGuards(Auth2);
