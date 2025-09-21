/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meal } from '../meal/meal.entity';
import { Country } from '../country/county.entity';
import { Restaurant } from './restaurant.entity';

@Injectable()
export class FilterService {
  constructor(
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(Country) private countryRepo: Repository<Country>,
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
  ) {}

  async getCountries(category?: string, search?: string) {
    const query = this.countryRepo
      .createQueryBuilder('country')
      .leftJoin('country.restaurants', 'restaurant')
      .leftJoin('restaurant.category', 'category')
      .loadRelationCountAndMap(
        'country.restaurantsCount',
        'country.restaurants',
      ); // 👈 أسهل

    if (category) {
      query.andWhere('category.name ILIKE :category', {
        category: `%${category}%`,
      });
    }

    if (search) {
      query.andWhere('country.name ILIKE :search', { search: `%${search}%` });
    }

    return query.getMany();
  }

  async getMeals(userId?: string, category?: string, search?: string) {
    const query = this.mealRepo
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.category', 'category')
      .leftJoinAndSelect('meal.restaurant', 'restaurant');

    if (category) {
      query.andWhere('category.name ILIKE :category', {
        category: `%${category}%`,
      });
    }

    if (search) {
      query.andWhere('meal.name ILIKE :search', { search: `%${search}%` });
    }

    // إذا في مستخدم
    if (userId) {
      query.addSelect((subQuery) => {
        return subQuery
          .select('COUNT(1)')
          .from('like', 'ml')
          .where('ml.mealId = meal.id')
          .andWhere('ml.userId = :userId', { userId });
      }, 'isLiked');
    }

    const meals = await query.getRawAndEntities();

    // تجهيز النتيجة
    return meals.entities.map((meal, idx) => ({
      ...meal,
      isLiked: userId ? Boolean(parseInt(meals.raw[idx].isLiked, 10)) : false,
    }));
  }

  async getRestaurants(userId?: string, category?: string, search?: string) {
    const query = this.restaurantRepo
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.category', 'category');

    if (category) {
      query.andWhere('category.name ILIKE :category', {
        category: `%${category}%`,
      });
    }

    if (search) {
      query.andWhere('restaurant.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // إذا في مستخدم → subquery لتحديد إذا عامل لايك
    if (userId) {
      query.addSelect((subQuery) => {
        return subQuery
          .select('COUNT(1)')
          .from('like', 'rl') // 👈 اسم جدول اللايكات تبع المطاعم
          .where('rl.restaurantId = restaurant.id')
          .andWhere('rl.userId = :userId', { userId });
      }, 'isLiked');
    }

    const restaurants = await query.getRawAndEntities();

    return restaurants.entities.map((restaurant, idx) => ({
      ...restaurant,
      isLiked: userId
        ? Boolean(parseInt(restaurants.raw[idx].isLiked, 10))
        : false,
    }));
  }
}
