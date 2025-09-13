/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/user.entity';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  async rate(
    @CurrentUser() user: User,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingService.createOrUpdate(user, dto);
  }
}
