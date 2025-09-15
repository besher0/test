import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reaction } from './reaction.entity';
import { ReactionService } from './reaction.service';
import { ReactionController } from './reaction.controller';
import { Post } from 'src/post/post.entity';
import { User } from 'src/user/user.entity';
import { Reel } from 'src/reel/reel.entity';

@Module({
  // eslint-disable-next-line prettier/prettier
  imports: [TypeOrmModule.forFeature([Reaction, Post, User,Reel])],
  providers: [ReactionService],
  controllers: [ReactionController],
})
export class ReactionModule {}
