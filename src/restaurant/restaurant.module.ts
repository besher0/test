/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { User } from 'src/user/user.entity';
import { Category } from 'src/category/category.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, User, Category]),CloudinaryModule],
  providers: [RestaurantService],
  controllers: [RestaurantController],
  exports: [RestaurantService],
})
export class RestaurantModule {}
