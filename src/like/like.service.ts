/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Meal } from 'src/meal/meal.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { BusinessType } from 'src/common/business-type.enum';
import { Country } from 'src/country/county.entity';

@Injectable()
export class LikeService {
  constructor(
  @InjectRepository(Like) private likeRepo: Repository<Like>,
  @InjectRepository(Meal) private mealRepo: Repository<Meal>,
  @InjectRepository(Restaurant) private restRepo: Repository<Restaurant>,
  @InjectRepository(Country) private countryRepo: Repository<Country>,
  ) {}

async toggleLike(user: User, targetId: string, type?: BusinessType) {
  let entity: Meal | Restaurant | Country | null = null;
  let targetType: 'meal' | 'restaurant' | 'country' | null = null;

  entity = await this.mealRepo.findOne({ where: { id: targetId } });
  if (entity) targetType = 'meal';
  if (!entity) {
    entity = await this.restRepo.findOne({ where: { id: targetId } });
    if (entity) targetType = 'restaurant';
  }
  if (!entity) {
    entity = await this.countryRepo.findOne({ where: { id: targetId } });
    if (entity) targetType = 'country';
  }
  if (!entity || !targetType) {
    throw new NotFoundException('Entity not found');
  }

    const whereCondition: Record<string, any> = { user: { id: user.id } };
  if (targetType === 'meal') whereCondition.meal = { id: (entity as Meal).id };
  if (targetType === 'restaurant') whereCondition.restaurant = { id: (entity as Restaurant).id };
  if (targetType === 'country') whereCondition.country = { id: (entity as Country).id };

  const like = await this.likeRepo.findOne({ where: whereCondition });

  if (like) {
    await this.likeRepo.remove(like);
    return { isLiked: false, message: `تم إلغاء الإعجاب بـ ${type}` };
  }

  const createObj: Record<string, any> = { user };
    if (targetType === 'meal') {
      createObj.meal = entity as Meal;
      createObj.type = type;
    }
    if (targetType === 'restaurant') {
      createObj.restaurant = entity as Restaurant;
      createObj.type = type;
    }
    if (targetType === 'country') {
      createObj.country = entity as Country;
    }

  const newLike = this.likeRepo.create(createObj);
  await this.likeRepo.save(newLike);
  return { isLiked: true, message: `تم تسجيل الإعجاب بـ ${type} بنجاح` };
}

async getMealLikes(user: User, type: BusinessType, page = 1) {
  const take = 8;
  const [likes, total] = await this.likeRepo.findAndCount({
    where: {
      user: { id: user.id },
      meal: { id: Not(IsNull()) },
      type,
    },
    relations: ['meal', 'meal.restaurant'],
    order: { createdAt: 'DESC' },
    take,
    skip: (page - 1) * take,
  });

  const meals = likes.map((like) => ({
    id: like.meal.id,
    name: like.meal.name,
    image: like.meal.image_url || undefined,
    restaurant: {
      id: like.meal.restaurant.id,
      name: like.meal.restaurant.name,
      image: like.meal.restaurant.mainImage || undefined,
      logoUrl: like.meal.restaurant.logo_url || undefined,
    },
    isLiked: true,
  }));

  return {
    page,
    perPage: take,
    total,
    totalPages: Math.ceil(total / take),
    meals,
  };
}

async getRestaurantLikes(user: User, type: BusinessType, page = 1) {
  const take = 8;
  const [likes, total] = await this.likeRepo.findAndCount({
    where: {
      user: { id: user.id },
      restaurant: { id: Not(IsNull()) },
      type,
    },
    relations: ['restaurant'],
    order: { createdAt: 'DESC' },
    take,
    skip: (page - 1) * take,
  });

  const restaurants = likes.map((like) => ({
    ...like.restaurant,
    isLiked: true,
  }));

  return {
    page,
    perPage: take,
    total,
    totalPages: Math.ceil(total / take),
    restaurants,
  };
}

async getCountryLikes(user: User, page = 1) {
  const take = 8;
  const [likes, total] = await this.likeRepo.findAndCount({
    where: {
      user: { id: user.id },
      country: { id: Not(IsNull()) },
    },
    relations: ['country'],
    order: { createdAt: 'DESC' },
    take,
    skip: (page - 1) * take,
  });

  // احسب عدد المطاعم لكل دولة عبر استعلام مجمّع لمرة واحدة
  const countryIds = likes.map((l) => l.country?.id).filter((id): id is string => Boolean(id));

  let countsByCountryId = new Map<string, number>();
  if (countryIds.length > 0) {
    const rows = await this.restRepo
      .createQueryBuilder('restaurant')
      .select('restaurant.countryId', 'countryId')
      .addSelect('COUNT(1)', 'cnt')
      .where('restaurant.countryId IN (:...countryIds)', { countryIds })
      .andWhere('restaurant.isActive = true')
      .groupBy('restaurant.countryId')
      .getRawMany<{ countryId: string; cnt: string }>();

    countsByCountryId = new Map(
      rows.map((r) => [r.countryId, parseInt(r.cnt, 10) || 0]),
    );
  }

  const countries = likes.map((like) => ({
    id: like.country.id,
    name: like.country.name,
    imageUrl: like.country.imageUrl || undefined,
    logoImage: like.country.logoImage || undefined,
    restaurantsCount: countsByCountryId.get(like.country.id) || 0,
    isLiked: true,
  }));

  return {
    page,
    perPage: take,
    total,
    totalPages: Math.ceil(total / take),
    countries,
  };
}
}
