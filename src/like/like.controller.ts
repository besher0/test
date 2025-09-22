import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  ToggleLikeResponseDto,
  MealLikeDto,
  RestaurantLikeDto,
  CountryLikeDto,
} from './like.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';

@ApiTags('Likes')
@ApiBearerAuth()
@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id')
  @ApiOperation({
    summary: 'إعجاب/إلغاء إعجاب (وجبة، مطعم، دولة) حسب المعرّف فقط',
  })
  @ApiParam({ name: 'id', description: 'معرّف العنصر (وجبة / مطعم / دولة)' })
  @ApiOkResponse({ type: ToggleLikeResponseDto })
  async toggleLike(@Param('id') id: string, @CurrentUser() user: User) {
    return this.likeService.toggleLike(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-likes/meals')
  @ApiOperation({ summary: 'إرجاع قائمة الإعجابات الخاصة بالوجبات' })
  @ApiOkResponse({ type: MealLikeDto })
  async getMyLikes(@CurrentUser() user: User) {
    return this.likeService.getMealLikes(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-likes/restaurants')
  @ApiOperation({ summary: 'إرجاع قائمة إعجابات المطاعم الخاصة بالمستخدم' })
  @ApiOkResponse({ type: [RestaurantLikeDto] })
  async getRestaurantLikes(@CurrentUser() user: User) {
    return this.likeService.getRestaurantLikes(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-likes/countries')
  @ApiOperation({ summary: 'إرجاع قائمة إعجابات الدول الخاصة بالمستخدم' })
  @ApiOkResponse({ type: [CountryLikeDto] })
  async getCountryLikes(@CurrentUser() user: User) {
    return this.likeService.getCountryLikes(user);
  }
}
