import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { User } from '../user/user.entity';
import { Restaurant } from '../restaurant/restaurant.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async createOrUpdate(user: User, dto: CreateRatingDto): Promise<Rating> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: dto.restaurantId },
      relations: ['ratings'],
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    let rating = await this.ratingRepository.findOne({
      where: { user: { id: user.id }, restaurant: { id: dto.restaurantId } },
      relations: ['user', 'restaurant'],
    });

    if (rating) {
      rating.value = dto.value;
    } else {
      rating = this.ratingRepository.create({
        value: dto.value,
        user,
        restaurant,
      });
    }

    await this.ratingRepository.save(rating);
    await this.updateRestaurantAverage(restaurant.id);
    return rating;
  }

  async updateRestaurantAverage(restaurantId: string): Promise<void> {
    const ratings = await this.ratingRepository.find({
      where: { restaurant: { id: restaurantId } },
    });

    const average =
      ratings.reduce((sum, r) => sum + r.value, 0) / (ratings.length || 1);

    await this.restaurantRepository.update(restaurantId, {
      averageRating: average,
    });
  }
}
