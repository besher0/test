/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { User } from '../user/user.entity';
import { Meal } from '../meal/meal.entity';
import { Country } from '../country/county.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { Rating } from '../rating/rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Meal, Country, Restaurant, Rating])],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
