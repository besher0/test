import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meal } from './meal.entity';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Category } from 'src/category/category.entity';
import { User } from 'src/user/user.entity';
import { Country } from 'src/country/county.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, Restaurant, Category, User, Country]),
    CloudinaryModule,
  ],
  providers: [MealService],
  controllers: [MealController],
  exports: [MealService],
})
export class MealModule {}
