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
        const favIds = user.favoriteFood.map((f: Meal) => f.id);

        favoriteMeals = await this.mealRepo.find({
          where: { id: In(favIds) },
          relations: ['restaurant', 'likes'],
          take: 7,
        });

        if (favoriteMeals.length < 7) {
          const needed = 7 - favoriteMeals.length;
          const extraMeals = await this.mealRepo.find({
            where: { id: Not(In(favIds)) },
            relations: ['restaurant', 'likes'],
            take: needed,
          });
          favoriteMeals = [...favoriteMeals, ...extraMeals];
        }
      } else {
        favoriteMeals = await this.mealRepo.find({
          take: 7,
          relations: ['restaurant', 'likes'],
        });
      }
    } else {
      favoriteMeals = await this.mealRepo.find({
        take: 7,
        relations: ['restaurant', 'likes'],
      });
    }

    // المطابخ العربية
    const arabicKitchens = await this.countryRepo.find({
      take: 7,
      order: { name: 'ASC' },
      relations: ['likes'],
    });

    // المطاعم الموصى بها
    const recommendedRestaurants = await this.restRepo.find({
      order: { averageRating: 'DESC' },
      take: 7,
      select: ['id', 'name', 'logo_url', 'description', 'averageRating'],
      relations: ['likes'],
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
        isLiked: userId ? meal.likes.some((l) => l.user.id === userId) : false,
      })),
      arabicKitchens: arabicKitchens.map((country) => ({
        id: country.id,
        name: country.name,
        imageUrl: country.imageUrl,
        isLiked: userId
          ? country.likes.some((l) => l.user.id === userId)
          : false,
      })),
      recommendedRestaurants: recommendedRestaurants.map((r) => ({
        id: r.id,
        name: r.name,
        logoUrl: r.logo_url,
        description: r.description,
        rating: r.averageRating,
        isLiked: userId ? r.likes.some((l) => l.user.id === userId) : false,
      })),
    };
  }
}
