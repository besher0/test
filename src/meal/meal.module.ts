/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meal } from './meal.entity';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Category } from 'src/category/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meal, Restaurant, Category])],
  providers: [MealService],
  controllers: [MealController],
  exports: [MealService],
})
export class MealModule {}
