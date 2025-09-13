/* eslint-disable prettier/prettier */
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '../user/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Cart } from 'src/cart/cart.entity';
import { Order } from 'src/order/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User,Cart,Order]),forwardRef(() => AuthModule),],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}