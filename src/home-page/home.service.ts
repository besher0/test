import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Meal } from '../meal/meal.entity';
import { Country } from '../country/county.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { Rating } from '../rating/rating.entity';
import { BusinessType } from '../home-page/home.controller';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(Country) private countryRepo: Repository<Country>,
    @InjectRepository(Restaurant) private restRepo: Repository<Restaurant>,
    @InjectRepository(Rating) private ratingRepo: Repository<Rating>,
  ) {}

  async getHomeSections(businessType: BusinessType, userId?: string) {
    // let favoriteMeals: Meal[] = [];
    // if (businessType === BusinessType.RESTAURANT) {
    //   if (userId) {
    //     const user = await this.userRepo.findOne({
    //       where: { id: userId },
    //       relations: ['favoriteFood'],
    //     });

    //     if (
    //       user &&
    //       Array.isArray(user.favoriteFood) &&
    //       user.favoriteFood.length > 0
    //     ) {
    //       const favIds = user.favoriteFood.map((f: Meal) => f.id);

    //       favoriteMeals = await this.mealRepo.find({
    //         where: { id: In(favIds) },
    //         relations: ['restaurant', 'likes'],
    //         take: 7,
    //       });

    //       if (favoriteMeals.length < 7) {
    //         const needed = 7 - favoriteMeals.length;
    //         const extraMeals = await this.mealRepo.find({
    //           where: { id: Not(In(favIds)) },
    //           relations: ['restaurant', 'likes'],
    //           take: needed,
    //         });
    //         favoriteMeals = [...favoriteMeals, ...extraMeals];
    //       }
    //     } else {
    //       favoriteMeals = await this.mealRepo.find({
    //         take: 7,
    //         relations: ['restaurant', 'likes'],
    //       });
    //     }
    //   } else {
    //     favoriteMeals = await this.mealRepo.find({
    //       take: 7,
    //       relations: ['restaurant', 'likes'],
    //     });
    //   }
    // } else if (businessType === BusinessType.STORE) {
    //   // === المخازن (products) ===
    //   favoriteMeals = await this.mealRepo.find({
    //     take: 7,
    //     relations: ['store', 'likes'],
    //   });
    // }

    // المطابخ العربية
    // let topMealsOrProducts: Meal[] = [];

    // if (businessType === BusinessType.RESTAURANT) {
    //   // جلب الوجبات الأكثر طلباً
    //   topMealsOrProducts = await this.mealRepo.find({
    //     take: 7,
    //     relations: ['restaurant', 'likes', 'orders'],
    //     order: {
    //       // ترتيب تنازلي بعدد الطلبات
    //       orders: { length: 'DESC' } as any,
    //     },
    //   });
    // } else if (businessType === BusinessType.STORE) {
    //   // جلب المنتجات الأكثر طلباً
    //   topMealsOrProducts = await this.mealRepo.find({
    //     take: 7,
    //     relations: ['store', 'likes', 'orders'],
    //     order: {
    //       orders: { length: 'DESC' } as any,
    //     },
    //   });
    // }
    const meals = await this.mealRepo
      .createQueryBuilder('meal')
      .leftJoin('meal.orderItems', 'orderItem') // Meal → OrderItem
      .leftJoin('orderItem.order', 'order')
      .leftJoinAndSelect('meal.restaurant', 'restaurant')
      .addSelect('COUNT(order.id)', 'orderscount')
      .where('meal.type = :businessType', { businessType })
      .groupBy('meal.id')
      .addGroupBy('restaurant.id')
      .orderBy('orderscount', 'DESC')
      .take(7)
      .getMany();

    for (const meal of meals) {
      meal.likes = await this.mealRepo
        .createQueryBuilder()
        .relation(Meal, 'likes')
        .of(meal) // ⬅️ يجيب likes الخاصة بالـ meal هذا
        .loadMany();
    }
    const arabicKitchens = await this.countryRepo.find({
      take: 7,
      order: { name: 'ASC' },
      relations: ['likes'],
    });

    // المطاعم الموصى بها
    const topRestaurants = await this.restRepo
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.likes', 'like')
      .leftJoinAndSelect('like.user', 'user')
      .where('restaurant.type = :businessType', { businessType })
      .orderBy('restaurant.averageRating', 'DESC') // 👈 استخدم العمود مباشرة
      .take(7)
      .getMany();

    return {
      favoriteMeals: meals.map((meal: Meal & { likes: any[] }) => ({
        id: meal.id,
        name: meal.name,
        image: meal.image_url,
        duration: meal.preparationTime,
        restaurant: meal.restaurant
          ? { id: meal.restaurant.id, name: meal.restaurant.name }
          : null,
        likes: meal.likes,
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
      recommendedRestaurants: topRestaurants.map((r) => ({
        id: r.id,
        name: r.name,
        logoUrl: r.logo_url,
        description: r.description,
        rating: r.averageRating,
        isLiked: userId ? r.likes.some((l) => l.user?.id === userId) : false,
      })),
    };
  }
}
