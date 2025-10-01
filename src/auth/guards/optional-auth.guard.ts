import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: TUser): TUser {
    // لو ما في توكن أو التوكن غير صالح → نرجع null بدل error
    return user ? user : (null as unknown as TUser);
  }
}
