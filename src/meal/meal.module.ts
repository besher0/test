/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meal } from './meal.entity';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Category } from 'src/category/category.entity';
import { User } from 'src/user/user.entity';
import { Country } from 'src/country/county.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meal, Restaurant, Category,User,Country])],
  providers: [MealService],
  controllers: [MealController],
  exports: [MealService],
})
export class MealModule {}
