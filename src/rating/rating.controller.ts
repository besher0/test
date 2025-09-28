import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Get,
  UseInterceptors,
  UploadedFile,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { RatingService } from './rating.service';
import { Rating } from './rating.entity';
import { BusinessType, RatingReply } from './rating-reply.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { CreateRatingWithImageDto } from './dto/create-rating.dto';
import { CreateReplyDto } from './dto/rating-reply.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('restaurant/:restaurantId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Add rating to a restaurant (with optional image upload)',
  })
  @ApiResponse({ status: 201, type: Rating })
  @ApiQuery({
    name: 'businessType',
    enum: BusinessType,
    required: true,
    description: 'Business type (restaurant or store)',
  })
  async addRating(
    @Param('restaurantId') restaurantId: string,
    @Query('businessType') businessType: BusinessType,
    @Body() dto: CreateRatingWithImageDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<Rating> {
    return await this.ratingService.addRatingWithImage(
      user,
      restaurantId,
      dto,
      file,
      businessType,
    );
  }

  // 2️⃣ الرد على تقييم (صاحب المطعم فقط)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a rating (only restaurant owner)' })
  @ApiResponse({ status: 201, type: RatingReply })
  async replyToRating(
    @Param('id') ratingId: string,
    @Body() createReplyDto: CreateReplyDto,
    @CurrentUser() user: User,
  ): Promise<RatingReply> {
    return this.ratingService.addReply(
      ratingId,
      user,
      createReplyDto.replyText,
    );
  }

  // 3️⃣ جلب تقييمات مطعم
  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get all ratings of a restaurant' })
  @ApiResponse({ status: 200, type: [Rating] })
  async getRestaurantRatings(
    @Param('restaurantId') restaurantId: string,
  ): Promise<Rating[]> {
    return this.ratingService.getRestaurantRatings(restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':ratingId')
  async deleteRating(
    @CurrentUser() user: User,
    @Param('ratingId') ratingId: string,
  ) {
    return this.ratingService.deleteRating(user, ratingId);
  }
}
