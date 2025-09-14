/* eslint-disable prettier/prettier */
import { Controller, Post, Param, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FollowService } from './follow.service';
import { Request } from 'express';
import { User } from 'src/user/user.entity';
import { MyFollowedRestaurantsResponseDto, ToggleFollowResponseDto } from './dto/follow-response.dto';

interface AuthRequest extends Request {
  user: User;
}

@ApiTags('Follow')
@ApiBearerAuth()
@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(JwtAuthGuard)
  @Post('restaurant/:restaurantId')
  @ApiOperation({ summary: 'تابع/ألغِ متابعة مطعم' })  // ✅ وصف
    @ApiOkResponse({ type: ToggleFollowResponseDto })
  @ApiParam({ name: 'restaurantId', description: 'معرّف المطعم' })
  async toggleFollow(@Param('restaurantId') restaurantId: string, @Req() req: AuthRequest) {
    return this.followService.toggleFollow(req.user, restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-restaurants')
  @ApiOperation({ summary: 'احصل على قائمة المطاعم التي أتابعها' }) 
  @ApiOkResponse({ type: MyFollowedRestaurantsResponseDto })
  async getMyFollowedRestaurants(@Req() req: AuthRequest) {
    return this.followService.getFollowedRestaurants(req.user);
  }
}
