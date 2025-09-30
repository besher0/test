import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Meal } from '../meal/meal.entity';
import { Country } from '../country/county.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { BusinessType } from '../common/business-type.enum';
import { Rating } from '../rating/rating.entity';
import { Post } from '../post/post.entity';
import { PostReaction } from '../post/post-reaction.entity';
import { Story } from '../story/story.entity';
import { Follow } from '../follow/follow.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(Country) private countryRepo: Repository<Country>,
    @InjectRepository(Restaurant) private restRepo: Repository<Restaurant>,
    @InjectRepository(Rating) private ratingRepo: Repository<Rating>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostReaction)
    private postReactionRepo: Repository<PostReaction>,
    @InjectRepository(Story) private storyRepo: Repository<Story>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
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

  async getFeed(businessType: BusinessType, userId?: string) {
    // Posts by business type with reactions summary and user reaction
    const posts = await this.postRepo.find({
      where: { businessType },
      relations: ['restaurant', 'reactions', 'reactions.user'],
      order: { createdAt: 'DESC' },
    });

    const postItems = posts.map((post) => {
      const like = post.reactions?.filter((r) => r.type === 'like').length ?? 0;
      const love = post.reactions?.filter((r) => r.type === 'love').length ?? 0;
      const fire = post.reactions?.filter((r) => r.type === 'fire').length ?? 0;
      const userReaction = userId
        ? (post.reactions?.find((r) => r.user?.id === userId)?.type ?? null)
        : null;
      return {
        id: post.id,
        text: post.text,
        mediaUrl: post.mediaUrl,
        thumbnailUrl: post.thumbnailUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        restaurant: post.restaurant
          ? { id: post.restaurant.id, name: post.restaurant.name }
          : null,
        reactions: { like, love, fire },
        hasReacted: userReaction,
      };
    });

    // Stories from followed restaurants/stores by business type (not expired)
    let storyItems: Array<{
      id: string;
      text?: string;
      mediaUrl?: string;
      thumbnailUrl?: string;
      createdAt: Date;
      expiresAt: Date;
      restaurant: { id: string; name: string } | null;
      hasReacted: 'like' | 'love' | 'fire' | null;
    }> = [];

    if (userId) {
      const follows = await this.followRepo.find({
        where: { user: { id: userId }, type: businessType },
        relations: ['restaurant'],
      });
      const followedRestaurantIds = follows
        .map((f) => f.restaurant?.id)
        .filter((id): id is string => !!id);

      if (followedRestaurantIds.length > 0) {
        const now = new Date();
        const stories = await this.storyRepo.find({
          where: {
            restaurant: { id: In(followedRestaurantIds) },
            expiresAt: MoreThan(now),
            businessType,
          },
          relations: ['restaurant', 'reactions', 'reactions.user'],
          order: { createdAt: 'DESC' },
        });

        storyItems = stories.map((s) => {
          const userReaction =
            s.reactions?.find((r) => r.user?.id === userId)?.type ?? null;
          return {
            id: s.id,
            text: s.text,
            mediaUrl: s.mediaUrl,
            thumbnailUrl: s.thumbnailUrl,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            restaurant: s.restaurant
              ? { id: s.restaurant.id, name: s.restaurant.name }
              : null,
            hasReacted: userReaction,
          };
        });
      }
    }

    return {
      posts: postItems,
      stories: storyItems,
    };
  }
}
