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

  // helper to safely parse isLiked from raw result row
  private parseIsLiked(rawRow: any): boolean {
    try {
      const row = rawRow as Record<string, unknown> | undefined;
      const v = row ? row['isLiked'] : undefined;
      if (v === undefined || v === null) return false;
      // handle based on actual type to avoid '[object Object]' stringification
      if (typeof v === 'number') return v > 0;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') {
        const n = parseInt(v, 10);
        return !Number.isNaN(n) && n > 0;
      }
      return false;
    } catch (e) {
      console.warn('parseIsLiked error', e);
      return false;
    }
  }

  async getCountries(
    type: 'restaurant' | 'store',
    category?: string,
    search?: string,
  ) {
    const query = this.countryRepo
      .createQueryBuilder('country')
      .leftJoin(
        'country.restaurants',
        'restaurant',
        'restaurant.type = :type AND restaurant.isActive = true',
        { type },
      );

    if (category) {
      query.leftJoin(
        'restaurant.category',
        'category',
        'category.name ILIKE :category',
        { category: `%${category}%` },
      );
    } else {
      query.leftJoin('restaurant.category', 'category');
    }

    // search by country name (safe to keep in WHERE)
    if (search) {
      query.andWhere('country.name ILIKE :search', { search: `%${search}%` });
    }

    // Map count of matching restaurants (active + type, and category if provided) into country.restaurantsCount
    query.loadRelationCountAndMap(
      'country.restaurantsCount',
      'country.restaurants',
      'r',
      (qb) => {
        qb.where('r.type = :type', { type }).andWhere('r.isActive = true');
        if (category) {
          qb.leftJoin('r.category', 'c').andWhere('c.name ILIKE :category', {
            category: `%${category}%`,
          });
        }
        return qb;
      },
    );

    return query.getMany();
  }

  async getMeals(
    type: 'restaurant' | 'store',
    userId?: string,
    category?: string,
    search?: string,
    page: number = 1,
    limit: number = 8,
  ) {
    const query = this.mealRepo
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.category', 'category')
      .leftJoinAndSelect('meal.restaurant', 'restaurant')
      .where('restaurant.type = :type', { type });

    if (category) {
      // strict filter by category id
      query.andWhere('category.id = :categoryId', { categoryId: category });
    }

    if (search) {
      query.andWhere('meal.name ILIKE :search', { search: `%${search}%` });
    }

    // if user provided -> add subquery to mark isLiked
    if (userId) {
      query.addSelect((subQuery) => {
        return subQuery
          .select('COUNT(1)')
          .from('like', 'ml')
          .where('ml.mealId = meal.id')
          .andWhere('ml.userId = :userId', { userId });
      }, 'isLiked');
    }

    // only meals from active restaurants
    query.andWhere('restaurant.isActive = true');

    // pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [entities, total] = await query.getManyAndCount();

    // need raw for isLiked detection; run a parallel raw fetch when userId is provided
    if (userId) {
      const raw = await query
        .select(['meal.id'])
        .addSelect((subQuery) => {
          return subQuery
            .select('COUNT(1)')
            .from('like', 'ml')
            .where('ml.mealId = meal.id')
            .andWhere('ml.userId = :userId', { userId });
        }, 'isLiked')
        .getRawMany();

      return {
        items: entities.map((meal, idx) => ({
          ...meal,
          isLiked: this.parseIsLiked(raw[idx]),
        })),
        total,
        page,
        limit,
      };
    }

    return {
      items: entities.map((meal) => ({ ...meal, isLiked: false })),
      total,
      page,
      limit,
    };
  }

  async getRestaurants(
    type: 'restaurant' | 'store',
    userId?: string,
    category?: string,
    search?: string,
    page: number = 1,
    limit: number = 8,
  ) {
    const query = this.restaurantRepo
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.category', 'category')
      .where('restaurant.type = :type', { type });

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

    // if user -> add subquery to mark isLiked
    if (userId) {
      query.addSelect((subQuery) => {
        return subQuery
          .select('COUNT(1)')
          .from('like', 'rl')
          .where('rl.restaurantId = restaurant.id')
          .andWhere('rl.userId = :userId', { userId });
      }, 'isLiked');
    }

    // only active restaurants
    query.andWhere('restaurant.isActive = true');

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [entities, total] = await query.getManyAndCount();

    if (userId) {
      const raw = await query
        .select(['restaurant.id'])
        .addSelect((subQuery) => {
          return subQuery
            .select('COUNT(1)')
            .from('like', 'rl')
            .where('rl.restaurantId = restaurant.id')
            .andWhere('rl.userId = :userId', { userId });
        }, 'isLiked')
        .getRawMany();

      return {
        items: entities.map((restaurant, idx) => ({
          ...restaurant,
          isLiked: this.parseIsLiked(raw[idx]),
        })),
        total,
        page,
        limit,
      };
    }

    return {
      items: entities.map((restaurant) => ({ ...restaurant, isLiked: false })),
      total,
      page,
      limit,
    };
  }
}
