/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
    });
  }

  async validate(payload: { id: string; email: string; userType: string }) {
  const user = await this.userService.findById(payload.id);
  console.log('validate'+user.userType)
  if (!user) throw new UnauthorizedException('User not found');

  return {
    id: user.id,
    userType: user.userType, // ناخد من DB مش من payload
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

}