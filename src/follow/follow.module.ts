import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './follow.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { User } from 'src/user/user.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, User, Restaurant])],
  providers: [FollowService],
  controllers: [FollowController],
})
export class FollowModule {}
