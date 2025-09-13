/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { User } from 'src/user/user.entity';
import { CartModule } from 'src/cart/cart.module';
import { Meal } from 'src/meal/meal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, User,Meal]), CartModule],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
