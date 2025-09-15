/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { ReactDto } from './dto/create-reaction.dto';
import { ReactResponseDto } from './dto/react-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';


@ApiTags('Reactions')
@ApiBearerAuth()
@Controller('reaction')
@UseGuards(JwtAuthGuard)
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @Post('post/:postId')
  @ApiOperation({ summary: 'تفاعل (toggle) مع بوست — like/love/fire' })
  @ApiParam({ name: 'postId', description: 'معرّف البوست' })
  @ApiResponse({ type: ReactResponseDto })
  async reactOnPost(
    @CurrentUser() user: User,
    @Param('postId') postId: string,
    @Body() dto: ReactDto,
  ) {
    return await this.reactionService.toggleReaction(user.id, postId, dto.type);
  }

  @Get(':postId/summary')
  @ApiOperation({ summary: "Get (':postId/summary')".trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  summary(@Param('postId') postId: string) {
    return this.reactionService.getPostReactionsCount(postId);
  }

  @Post('reel/:reelId')
  @ApiOperation({ summary: 'تفاعل (toggle) مع ريل — like/love/fire' })
  @ApiParam({ name: 'reelId', description: 'معرّف الريل' })
  @ApiResponse({ type: ReactResponseDto })
  async reactOnReel(
    @CurrentUser() user: User,
    @Param('reelId') reelId: string,
    @Body() dto: ReactDto,
  ) {
    return await this.reactionService.toggleReelReaction(user.id, reelId, dto.type);
  }

    @Get('reel/:reelId/summary')
  @ApiOperation({ summary: 'إرجاع عدد التفاعلات لكل نوع على ريل' })
  @ApiResponse({ status: 200, description: 'Success' })
  summaryReel(@Param('reelId') reelId: string) {
    return this.reactionService.getReelReactionsCount(reelId);
  }
}
