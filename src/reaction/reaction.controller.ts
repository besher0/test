/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';


@ApiTags('Reactions')
@Controller('reactions')
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Post endpoint' })
  @ApiBody({ schema: { example: {"postId": "88888888-8888-4888-8888-888888888888", "type": "like"} } })
  @ApiResponse({ status: 201, description: 'Created', schema: { example: {"postId": "88888888-8888-4888-8888-888888888888", "type": "like"} } })
  toggle(@CurrentUser() user: User, @Body() dto: CreateReactionDto) {
    return this.reactionService.toggleReaction(user, dto.postId, dto.type);
  }

  @Get(':postId/summary')
  @ApiOperation({ summary: "Get (':postId/summary')".trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  summary(@Param('postId') postId: string) {
    return this.reactionService.getReactionsSummary(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':postId/me')
  @ApiOperation({ summary: "Get (':postId/me')".trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  myReaction(@CurrentUser() user: User, @Param('postId') postId: string) {
    return this.reactionService.getUserReaction(user, postId);
  }
}
