import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { NotificationModule } from 'src/notification/notification.module';
import { User } from 'src/user/user.entity';
import { CartModule } from 'src/cart/cart.module';
import { Meal } from 'src/meal/meal.entity';
import { DeliveryLocation } from 'src/restaurant/delivery-location.entity';
import { PayPalModule } from 'src/paypal/paypal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, User, Meal, DeliveryLocation]),
    CartModule,
    PayPalModule,
    NotificationModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
