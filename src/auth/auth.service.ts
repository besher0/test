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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from 'src/restaurant/restaurant.entity';
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
    @InjectRepository(Restaurant)
    private restaurantRepo?: Repository<Restaurant>,
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
    const result: any = {
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

    // If the user is a business owner, include their business id(s) in the login response
    if (user.userType === 'restaurant' || user.userType === 'store') {
      try {
        if (this.restaurantRepo) {
          const restaurants = await this.restaurantRepo.find({
            where: { owner: { id: user.id } },
          });
          const ids = restaurants.map((r) => r.id);
          if (ids.length > 0) {
            // result.businessIds = ids;
            result.businessId = ids[0]; // primary business id (first)
          } else {
            // result.businessIds = [];
            result.businessId = null;
          }
        }
      } catch {
        // ignore business lookup errors
      }
    }

    // do not persist coordinates on login anymore (handled at registration/update)

    return result as {
      accessToken: string;
      user: any;
      // businessIds?: string[];
      businessId?: string | null;
    };
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
