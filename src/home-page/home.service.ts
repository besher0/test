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

      if (
        user &&
        Array.isArray(user.favoriteFood) &&
        user.favoriteFood.length > 0
      ) {
        // IDs للمأكولات المفضلة
        const favIds: number[] = user.favoriteFood.map((f: Meal) =>
          Number(f.id),
        );

        // نجيب الوجبات المفضلة
        favoriteMeals = await this.mealRepo.find({
          where: { id: In(favIds) },
          relations: ['restaurant'],
          take: 7,
        });

        // لو أقل من 7 نكمل
        if (favoriteMeals.length < 7) {
          const needed = 7 - favoriteMeals.length;
          const extraMeals = await this.mealRepo.find({
            where: { id: Not(In(favIds)) },
            relations: ['restaurant'],
            take: needed,
          });
          favoriteMeals = [...favoriteMeals, ...extraMeals];
        }
      } else {
        // لو ما عنده ولا وجبة
        favoriteMeals = await this.mealRepo.find({
          take: 7,
          relations: ['restaurant'],
        });
      }
    } else {
      // fallback: لو ما في توكن
      favoriteMeals = await this.mealRepo.find({
        take: 7,
        relations: ['restaurant'],
      });
    }

    // 2. المطابخ العربية (من جدول Country)
    const arabicKitchens = await this.countryRepo.find({
      take: 7,
      order: { name: 'ASC' },
    });

    // 3. المطاعم الموصى بها
    // const rawRestaurants = await this.restRepo
    //   .createQueryBuilder('r')
    //   .leftJoin('r.ratings', 'rating')
    //   .select([
    //     'r.id AS id',
    //     'r.name AS name',
    //     'r.logo_url AS logoUrl',
    //     'r.description AS description',
    //     'AVG(rating.score) AS avgRating',
    //   ])
    //   .groupBy('r.id')
    //   .addGroupBy('r.name')
    //   .addGroupBy('r.logo_url')
    //   .addGroupBy('r.description')
    //   .orderBy('avgRating', 'DESC')
    //   .limit(7)
    //   .getRawMany();

    const recommendedRestaurants = await this.restRepo.find({
      order: { averageRating: 'DESC' },
      take: 7,
      select: ['id', 'name', 'logo_url', 'description', 'averageRating'],
    });

    return {
      favoriteMeals: favoriteMeals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        image: meal.image_url,
        duration: meal.preparationTime,
        restaurant: meal.restaurant
          ? { id: meal.restaurant.id, name: meal.restaurant.name }
          : null,
      })),
      arabicKitchens,
      recommendedRestaurants,
    };
  }
}
