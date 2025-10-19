import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from 'src/like/like.entity';
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
    @InjectRepository(Like) private likeRepo: Repository<Like>,
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
    userId?: string,
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
    type CountryWithCount = Country & { restaurantsCount?: number };
    const countries = (await query.getMany()) as CountryWithCount[];

    let likedSet: Set<string> | undefined;
    if (userId) {
      const likedRows = await this.likeRepo
        .createQueryBuilder('l')
        .select('l.countryId', 'countryId')
        .where('l.userId = :userId', { userId })
        .getRawMany<{ countryId: string }>();
      likedSet = new Set(likedRows.map((r) => r.countryId));
    }

    return countries.map((c: CountryWithCount) => ({
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl ?? null,
      logoImage: c.logoImage ?? null,
      restaurantsCount: c.restaurantsCount ?? 0,
      isLiked: likedSet ? likedSet.has(c.id) : false,
    }));
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

    // helper to format meal output
    function formatMeal(meal: Meal, isLiked: boolean) {
      return {
        id: meal.id,
        name: meal.name,
        image: meal.image_url,
        description: meal.description,
        price: meal.price,
        preparationTime: meal.preparationTime,
        restaurant: {
          id: meal.restaurant?.id,
          name: meal.restaurant?.name,
          image: meal.restaurant?.mainImage,
          logoUrl: meal.restaurant?.logo_url,
        },
        category: {
          id: meal.category?.id,
          name: meal.category?.name,
        },
        isLiked,
      };
    }

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
        items: entities.map((meal, idx) =>
          formatMeal(meal, this.parseIsLiked(raw[idx])),
        ),
        total,
        page,
        limit,
      };
    }

    return {
      items: entities.map((meal) => formatMeal(meal, false)),
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
