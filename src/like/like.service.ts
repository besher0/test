import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Meal } from 'src/meal/meal.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(Restaurant) private restRepo: Repository<Restaurant>,
  ) {}

  async toggleMealLike(user: User, mealId: string) {
    const meal = await this.mealRepo.findOne({ where: { id: mealId } });
    if (!meal) throw new NotFoundException('Meal not found');

    let like = await this.likeRepo.findOne({
      where: { user: { id: user.id }, meal: { id: meal.id } },
    });

    if (like) {
      await this.likeRepo.remove(like);
      return { isLiked: false, message: 'تم إلغاء الإعجاب' };
    }

    like = this.likeRepo.create({ user, meal });
    await this.likeRepo.save(like);
    return { isLiked: true, message: 'تم تسجيل الإعجاب بنجاح' };
  }

  async toggleRestaurantLike(user: User, restaurantId: string) {
    const restaurant = await this.restRepo.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    let like = await this.likeRepo.findOne({
      where: { user: { id: user.id }, restaurant: { id: restaurant.id } },
    });

    if (like) {
      await this.likeRepo.remove(like);
      return { isLiked: false, message: 'تم إلغاء الإعجاب' };
    }

    like = this.likeRepo.create({ user, restaurant });
    await this.likeRepo.save(like);
    return { isLiked: true, message: 'تم تسجيل الإعجاب بنجاح' };
  }

  async getMealLikes(user: User) {
    const likes = await this.likeRepo.find({
      where: {
        user: { id: user.id },
        meal: { id: Not(IsNull()) },
      },
      relations: ['meal'],
    });
    return likes.map((like) => ({
      id: like.meal.id,
      name: like.meal.name,
    }));
  }

  async getRestaurantLikes(user: User) {
    const likes = await this.likeRepo.find({
      where: {
        user: { id: user.id },
        restaurant: { id: Not(IsNull()) },
      },
      relations: ['restaurant'],
    });

    return likes.map((like) => ({
      id: like.restaurant.id,
      name: like.restaurant.name,
    }));
  }
}
