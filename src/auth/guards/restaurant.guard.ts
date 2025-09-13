/* eslint-disable prettier/prettier */
// src/auth/guards/restaurant.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class RestaurantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.userType !== 'restaurant') {
      throw new ForbiddenException('Only restaurant owners can perform this action');
    }

    return true;
  }
}
