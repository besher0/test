/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reel } from './reel.entity';
import { ReelService } from './reel.service';
import { ReelController } from './reel.controller';
import { User } from '../user/user.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reel, User, Restaurant]),CloudinaryModule],
  providers: [ReelService],
  controllers: [ReelController],
  exports: [ReelService],
})
export class ReelModule {}
