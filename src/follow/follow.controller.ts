import { Controller, Post, Param, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FollowService } from './follow.service';
import { Request } from 'express';
import { User } from 'src/user/user.entity';
import {
  MyFollowedRestaurantsResponseDto,
  ToggleFollowResponseDto,
} from './dto/follow-response.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { BusinessType } from 'src/restaurant/restaurant.entity';

@ApiTags('Follow')
@ApiBearerAuth()
@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(JwtAuthGuard)
  @Post('restaurant/:restaurantId')
  @ApiOperation({ summary: 'تابع/ألغِ متابعة مطعم' }) // ✅ وصف
  @ApiOkResponse({ type: ToggleFollowResponseDto })
  @ApiQuery({ name: 'type', enum: BusinessType })
  @ApiParam({ name: 'restaurantId', description: 'معرّف المطعم' })
  toggle(
    @CurrentUser() user: User,
    @Param('restaurantId') restaurantId: string,
    @Query('type') type: BusinessType,
  ) {
    return this.followService.toggleFollow(user.id, restaurantId, type);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-restaurants')
  @ApiQuery({ name: 'type', enum: BusinessType, required: false })
  // @ApiOperation({ summary: 'احصل على قائمة المطاعم التي أتابعها' })
  @ApiOkResponse({ type: MyFollowedRestaurantsResponseDto })
  async getMyFollowedRestaurants(
    @CurrentUser() user: User,
    @Query('type') type: BusinessType,
  ) {
    return this.followService.getFollowedRestaurants(user.id, type);
  }
}
