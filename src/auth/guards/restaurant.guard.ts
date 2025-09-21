// src/auth/guards/restaurant.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class RestaurantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { userType?: string } }>();
    const user = request.user;
    if (!user || user.userType !== 'restaurant') {
      throw new ForbiddenException(
        'Only restaurant owners can perform this action',
      );
    }
    return true;
  }
}
