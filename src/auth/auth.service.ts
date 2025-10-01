/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { NotificationService } from '../notification/notification.service';
import * as bcrypt from 'bcrypt';
// import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private jwtService: JwtService,
    private notificationService?: NotificationService,
  ) {}

  // accept optional fcm token and device type to persist push tokens on login
  async login(
    email: string,
    password: string,
    fcmToken?: string,
    deviceType?: string,
  ) {
    const user = await this.userService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { id: user.id, email: user.email, userType: user.userType };
    const result = {
      accessToken: this.jwtService.sign(payload),
      user,
    };
    // if client provided an FCM token, persist it for this user
    if (fcmToken && this.notificationService) {
      try {
        await this.notificationService.saveToken(
          user.id as unknown as string,
          fcmToken,
          deviceType || 'unknown',
        );
      } catch {
        // non-fatal: swallow so login still succeeds
      }
    }

    return result;
  }

  async register(
    createUserDto: CreateUserDto,
    fcmToken?: string,
    deviceType?: string,
  ) {
    const created = await this.userService.create(createUserDto);

    // UserService.create returns { user, accessToken }
    const createdObj = created as unknown as {
      user?: { id: string };
    } & Partial<{ id: string }>;
    const createdUser =
      createdObj.user ??
      ({ id: (createdObj as { id: string }).id } as { id: string });

    // persist FCM token if provided
    if (fcmToken && this.notificationService && createdUser) {
      try {
        await this.notificationService.saveToken(
          createdUser.id as unknown as string,
          fcmToken,
          deviceType || 'unknown',
        );
      } catch {
        // non-fatal: swallow
      }
    }

    return created;
  }

  async validateToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verify(token); // بيرجع الـ payload
    } catch (error) {
      return error;
    }
  }
}
