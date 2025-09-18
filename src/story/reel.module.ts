/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from './story.entity';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { User } from '../user/user.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { Reaction } from './reaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Story, User, Restaurant,Reaction]),CloudinaryModule],
  providers: [StoryService],
  controllers: [StoryController],
  exports: [StoryService],
})
export class ReelModule {}
