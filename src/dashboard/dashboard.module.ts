import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../user/user.entity';
import { Order } from '../order/order.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { Category } from '../category/category.entity';
import { Country } from '../country/county.entity';
import { Post } from '../post/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Order,
      Restaurant,
      Category,
      Country,
      Post,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
