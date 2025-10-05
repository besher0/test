import { Module } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';

import { VideoModule } from './cloudinary.video/video.module';

import { dataSourceOptions } from '../db/data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RestaurantModule } from './restaurant/restaurant.module';
import { MealModule } from './meal/meal.module';
import { RatingModule } from './rating/rating.module';
import { PostModule } from './post/post.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { CountryModule } from './country/country.module';
import { HomeModule } from './home-page/home.module';
import { FollowModule } from './follow/follow.module';
import { LikeModule } from './like/like.module';
import { ReelModule } from './story/reel.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PayPalModule } from './paypal/paypal.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UserModule,
    VideoModule,
    CategoryModule,
    RestaurantModule,
    MealModule,
    CartModule,
    OrderModule,
    RatingModule,
    PostModule,
    CountryModule,
    HomeModule,
    FollowModule,
    LikeModule,
    ReelModule,
    DashboardModule,
    PayPalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

/*
     inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: +config.get<number>('DB_PORT', 5432),
        username: 'postgres',
        password: '123456',
        database: config.get<string>('DB_DATABASE'),
       entities: [Category,Video,Conversation,Following,Interaction,Media,Notification,Post,Rating,Request,RequestItem,User,UserPreferences], // يمكن تغييره إلى '
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: true,
      }),
*/
