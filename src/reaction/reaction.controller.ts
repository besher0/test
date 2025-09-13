/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Controller('reactions')
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  toggle(@CurrentUser() user: User, @Body() dto: CreateReactionDto) {
    return this.reactionService.toggleReaction(user, dto.postId, dto.type);
  }

  @Get(':postId/summary')
  summary(@Param('postId') postId: string) {
    return this.reactionService.getReactionsSummary(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':postId/me')
  myReaction(@CurrentUser() user: User, @Param('postId') postId: string) {
    return this.reactionService.getUserReaction(user, postId);
  }
}
