/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { ToggleLikeResponseDto, MyLikesResponseDto } from './like.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';

@ApiTags('Likes')
@ApiBearerAuth()
@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('meal/:mealId')
  @ApiOperation({ summary: 'إعجاب/إلغاء إعجاب بوجبة' })
  @ApiParam({ name: 'mealId', description: 'معرّف الوجبة' })
  @ApiOkResponse({ type: ToggleLikeResponseDto })
  async toggleMealLike(@Param('mealId') mealId: string, @CurrentUser() user: User) {
    return this.likeService.toggleMealLike(user, mealId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('restaurant/:restaurantId')
  @ApiOperation({ summary: 'إعجاب/إلغاء إعجاب بمطعم' })
  @ApiParam({ name: 'restaurantId', description: 'معرّف المطعم' })
  @ApiOkResponse({ type: ToggleLikeResponseDto })
  async toggleRestaurantLike(@Param('restaurantId') restaurantId: string, @CurrentUser() user: User) {
    return this.likeService.toggleRestaurantLike(user, restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-likes')
  @ApiOperation({ summary: 'إرجاع قائمة الإعجابات الخاصة بالمستخدم' })
  @ApiOkResponse({ type: MyLikesResponseDto })
  async getMyLikes(@CurrentUser() user: User) {
    return this.likeService.getMyLikes(user);
  }
}
