/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/user.entity';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
    @ApiOperation({ summary: 'Post endpoint' })
  @ApiBody({ schema: { example: {"restaurantId": "33333333-3333-4333-8333-333333333333", "value": 5} } })
  @ApiResponse({ status: 201, description: 'Created', schema: { example: {"restaurantId": "33333333-3333-4333-8333-333333333333", "value": 5} } })
  async rate(
    @CurrentUser() user: User,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingService.createOrUpdate(user, dto);
  }
}
