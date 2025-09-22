import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { User } from 'src/user/user.entity';
import { Category } from 'src/category/category.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CountryModule } from 'src/country/country.module';
import { Country } from 'src/country/county.entity';
import { Rating } from 'src/rating/rating.entity';
import { Meal } from 'src/meal/meal.entity';
import { RestaurantImage } from './restaurant-image.entity';
import { RestaurantVideo } from './restaurant-video.entity';
import { Follow } from 'src/follow/follow.entity';
import { FilterService } from './filter.service';
import { DeliveryLocation } from './delivery-location.entity';
import { DeliveryLocationController } from './delivery-location.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      User,
      Category,
      Country,
      Rating,
      Meal,
      RestaurantImage,
      RestaurantVideo,
      Follow,
      DeliveryLocation,
    ]),
    CloudinaryModule,
    CountryModule,
  ],
  providers: [RestaurantService, FilterService],
  controllers: [RestaurantController, DeliveryLocationController],
  exports: [RestaurantService],
})
export class RestaurantModule {}
