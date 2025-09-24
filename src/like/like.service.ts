/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Meal } from 'src/meal/meal.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Country } from 'src/country/county.entity';

@Injectable()
export class LikeService {
  constructor(
  @InjectRepository(Like) private likeRepo: Repository<Like>,
  @InjectRepository(Meal) private mealRepo: Repository<Meal>,
  @InjectRepository(Restaurant) private restRepo: Repository<Restaurant>,
  @InjectRepository(Country) private countryRepo: Repository<Country>,
  ) {}

async toggleLike(user: User, targetId: string) {
  let entity: Meal | Restaurant | Country | null = null;
  let type: 'meal' | 'restaurant' | 'country' | null = null;

  entity = await this.mealRepo.findOne({ where: { id: targetId } });
  if (entity) type = 'meal';
  if (!entity) {
    entity = await this.restRepo.findOne({ where: { id: targetId } });
    if (entity) type = 'restaurant';
  }
  if (!entity) {
    entity = await this.countryRepo.findOne({ where: { id: targetId } });
    if (entity) type = 'country';
  }
  if (!entity || !type) {
    throw new NotFoundException('Entity not found');
  }

    const whereCondition: Record<string, any> = { user: { id: user.id } };
  if (type === 'meal') whereCondition.meal = { id: (entity as Meal).id };
  if (type === 'restaurant') whereCondition.restaurant = { id: (entity as Restaurant).id };
  if (type === 'country') whereCondition.country = { id: (entity as Country).id };

  const like = await this.likeRepo.findOne({ where: whereCondition });

  if (like) {
    await this.likeRepo.remove(like);
    return { isLiked: false, message: `تم إلغاء الإعجاب بـ ${type}` };
  }

  const createObj: Record<string, any> = { user };
  if (type === 'meal') createObj.meal = entity as Meal;
  if (type === 'restaurant') createObj.restaurant = entity as Restaurant;
  if (type === 'country') createObj.country = entity as Country;

  const newLike = this.likeRepo.create(createObj);
  await this.likeRepo.save(newLike);
  return { isLiked: true, message: `تم تسجيل الإعجاب بـ ${type} بنجاح` };
}



  async getMealLikes(user: User) {
    const likes = await this.likeRepo.find({
      where: {
        user: { id: user.id },
        meal: { id: Not(IsNull()) },
      },
      relations: ['meal'],
    });
return {
    meals: likes.map((like) => ({
      id: like.meal.id,
      name: like.meal.name,
      imageUrl: like.meal.image_url || undefined,
    })),
};

  }

  async getRestaurantLikes(user: User) {
    const likes = await this.likeRepo.find({
      where: {
        user: { id: user.id },
        restaurant: { id: Not(IsNull()) },
      },
      relations: ['restaurant'],
    });

  return {
    restaurants: likes.map((like) => ({
      id: like.restaurant.id,
      name: like.restaurant.name,
      imageUrl: like.restaurant.logo_url || undefined,
    })),
  };
}

  async getCountryLikes(user: User) {
  const likes = await this.likeRepo.find({
    where: {
      user: { id: user.id },
      country: { id: Not(IsNull()) }, // مثل ما عملت مع المطاعم بس هون للدول
    },
    relations: ['country'],
  });

  return {
    countries: likes.map((like) => ({
      id: like.country.id,
      name: like.country.name,
      imageUrl: like.country.imageUrl || undefined,
    })),
  };
}
}
