/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Meal } from '../meal/meal.entity';
import { Country } from '../country/county.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { Rating } from '../rating/rating.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(Country) private countryRepo: Repository<Country>,
    @InjectRepository(Restaurant) private restRepo: Repository<Restaurant>,
    @InjectRepository(Rating) private ratingRepo: Repository<Rating>,
  ) {}

  async getHomeSections(userId?: string) {
    let favoriteMeals: Meal[] = [];

    if (userId) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['favoriteFood'],
      });

      if (user && Array.isArray(user.favoriteFood) && user.favoriteFood.length > 0) {
        // IDs للمأكولات المفضلة
        const favIds: number[] = user.favoriteFood.map((f: Meal) => Number(f.id));

        // نجيب الوجبات المفضلة
        favoriteMeals = await this.mealRepo.find({
          where: { id: In(favIds) },
          take: 7,
        });

        // لو أقل من 7 نكمل
        if (favoriteMeals.length < 7) {
          const needed = 7 - favoriteMeals.length;
          const extraMeals = await this.mealRepo.find({
            where: { id: Not(In(favIds)) },
            take: needed,
          });
          favoriteMeals = [...favoriteMeals, ...extraMeals];
        }
      } else {
        // لو ما عنده ولا وجبة
        favoriteMeals = await this.mealRepo.find({ take: 7 });
      }
    } else {
      // fallback: لو ما في توكن
      favoriteMeals = await this.mealRepo.find({ take: 7 });
    }

    // 2. المطابخ العربية (من جدول Country)
    const arabicKitchens = await this.countryRepo.find({
      take: 7,
      order: { name: 'ASC' },
    });

    // 3. المطاعم الموصى بها
    const rawRestaurants = await this.restRepo
      .createQueryBuilder('r')
      .leftJoin('r.ratings', 'rating')
      .addSelect('AVG(rating.value)', 'avg_rating')
      .groupBy('r.id')
      .orderBy('avg_rating', 'DESC')
      .limit(7)
      .getRawMany();

    const recommendedRestaurants = rawRestaurants.map((r) => ({
      id: r.r_id,
      name: r.r_name,
      location: r.r_location,
      logoUrl: r.r_logo_url,
      averageRating: parseFloat(r.avg_rating) || 0,
    }));
    return {
      favoriteMeals,
      arabicKitchens,
      recommendedRestaurants,
    };
  }
}
