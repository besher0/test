/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { id: user.id, userType: user.userType };
    return {
      access_token: this.jwtService.sign(payload),
    user: user,

    };
  }

  async register(createUserDto: CreateUserDto){
    return this.userService.create(createUserDto);
  }

  async validateToken(token: string): Promise<any> {
  try {
    return await this.jwtService.verify(token); // بيرجع الـ payload
  } catch (error) {
    return error;
  }
}

}
