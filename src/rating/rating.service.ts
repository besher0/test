import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { BusinessType, RatingReply } from './rating-reply.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { User } from 'src/user/user.entity';
import { CreateRatingWithImageDto } from './dto/create-rating.dto';
import { UploadApiResponse } from 'cloudinary';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,

    @InjectRepository(RatingReply)
    private readonly replyRepo: Repository<RatingReply>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // 1️⃣ إضافة تقييم جديد
  async addRatingWithImage(
    user: User,
    restaurantId: string,
    dto: CreateRatingWithImageDto,
    file?: Express.Multer.File,
    businessType?: BusinessType,
  ): Promise<Rating> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId, type: businessType },
    });
    if (!restaurant) throw new NotFoundException('Restaurant/Store not found');

    let imageUrl: string | null = null;
    if (file) {
      const result: UploadApiResponse =
        await this.cloudinaryService.uploadImage(
          file,
          'ratings', // 👈 مجلد Cloudinary
        );
      imageUrl = result.secure_url;
    }

    const rating = this.ratingRepo.create({
      user,
      restaurant,
      type: businessType,
      score: dto.score,
      comment: dto.comment,
      imageUrl,
    });

    await this.ratingRepo.save(rating);

    // تحديث المتوسط الحسابي للمطعم
    await this.updateRestaurantAverageRating(restaurantId);

    return rating;
  }

  // 2️⃣ الرد على تقييم
  async addReply(
    ratingId: string,
    owner: User,
    replyText: string,
  ): Promise<RatingReply> {
    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId },
      relations: ['restaurant'],
    });
    if (!rating) throw new NotFoundException('Rating not found');

    const restaurant = await this.restaurantRepo.findOne({
      where: { id: rating.restaurant.id },
      relations: ['owner'],
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    if (restaurant.owner.id !== owner.id) {
      throw new ForbiddenException(
        'You are not allowed to reply to this rating',
      );
    }

    const reply = this.replyRepo.create({
      rating,
      restaurant,
      replyText,
    });

    return this.replyRepo.save(reply);
  }

  // 3️⃣ جلب كل تقييمات مطعم
  async getRestaurantRatings(restaurantId: string): Promise<Rating[]> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.ratingRepo.find({
      where: { restaurant: { id: restaurantId } },
      relations: ['user', 'reply'],
      order: { createdAt: 'DESC' },
    });
  }
  async deleteRating(user: User, ratingId: string): Promise<void> {
    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId },
      relations: ['user'],
    });
    if (!rating) throw new NotFoundException('Rating not found');
    if (rating.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own rating');
    }
    await this.ratingRepo.remove(rating);
  }

  private async updateRestaurantAverageRating(
    restaurantId: string,
  ): Promise<void> {
    const ratings = await this.ratingRepo.find({
      where: { restaurant: { id: restaurantId } },
    });

    if (ratings.length === 0) return;

    const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

    await this.restaurantRepo.update(restaurantId, { averageRating: avg });
  }
}
