import { Controller, Post, Get, Param, UseGuards, Query } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ToggleLikeResponseDto,
  MealLikesResponseDto,
  RestaurantLikesResponseDto,
  CountryLikesResponseDto,
} from './like.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { BusinessType } from 'src/common/business-type.enum';

@ApiTags('Likes')
@ApiBearerAuth()
@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id')
  @ApiOperation({
    summary: 'إعجاب/إلغاء إعجاب (وجبة، منتج، مطعم، مخزن، دولة) حسب المعرّف فقط',
  })
  @ApiParam({
    name: 'id',
    description: 'معرّف العنصر (وجبة/منتج/مطعم/مخزن/دولة)',
  })
  @ApiQuery({
    name: 'type',
    enum: BusinessType,
    required: false,
    description:
      'نوع الكيان (restaurant | store) في حالة كان العنصر مطعم/مخزن أو وجبة/منتج',
  })
  @ApiOkResponse({ type: ToggleLikeResponseDto })
  async toggleLike(
    @Param('id') id: string,
    @Query('type') type: BusinessType,
    @CurrentUser() user: User,
  ) {
    return this.likeService.toggleLike(user, id, type);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-likes/meals')
  @ApiOperation({
    summary: 'إرجاع قائمة إعجابات الوجبات/المنتجات الخاصة بالمستخدم',
  })
  @ApiQuery({
    name: 'type',
    enum: BusinessType,
    required: true,
    description: 'حدد نوع (restaurant | store) للوجبات/المنتجات',
  })
  @ApiOkResponse({ type: MealLikesResponseDto })
  async getMyLikes(
    @CurrentUser() user: User,
    @Query('type') type: BusinessType,
  ) {
    return this.likeService.getMealLikes(user, type);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-likes/restaurants')
  @ApiOperation({
    summary: 'إرجاع قائمة إعجابات المطاعم/المخازن الخاصة بالمستخدم',
  })
  @ApiQuery({
    name: 'type',
    enum: BusinessType,
    required: true,
    description: 'حدد نوع (restaurant | store) للمطاعم/المخازن',
  })
  @ApiOkResponse({ type: RestaurantLikesResponseDto })
  async getRestaurantLikes(
    @CurrentUser() user: User,
    @Query('type') type: BusinessType,
  ) {
    return this.likeService.getRestaurantLikes(user, type);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-likes/countries')
  @ApiOperation({ summary: 'إرجاع قائمة إعجابات الدول الخاصة بالمستخدم' })
  @ApiOkResponse({ type: CountryLikesResponseDto })
  async getCountryLikes(@CurrentUser() user: User) {
    return this.likeService.getCountryLikes(user);
  }
}
