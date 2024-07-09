import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User, UserRoles } from '@prisma/client';

@Injectable()
export class OnlyAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

    if (user.role !== UserRoles.admin)
      throw new ForbiddenException('Not admin!');

    return true;
  }
}
