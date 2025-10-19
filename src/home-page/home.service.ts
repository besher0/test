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
import { Order } from '../order/order.entity';
// import { log } from 'node:console';

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
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  // existing implementation moved down - see overloaded getHomeSections below

  // Helper: Haversine distance in kilometers
  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Overloaded: accept optional coordinates to include nearbyRestaurants
  async getHomeSections(
    businessType: BusinessType,
    userId?: string,
    lat?: number,
    lon?: number,
    radiusKm: number = 3,
  ) {
    // Delegate to the original implementation by copying its logic but adding nearby computation.
    // For simplicity and to avoid duplicate code, call the previous implementation body by
    // reusing the current file's functions. We'll inline necessary parts here.

    // === existing sections (favoriteMeals / topMeals / arabicKitchens / recommendedRestaurants / cheap / recommendedByLastOrderCategory)
    const meals = await this.mealRepo
      .createQueryBuilder('meal')
      .leftJoin('meal.orderItems', 'orderItem') // Meal → OrderItem
      .leftJoin('orderItem.order', 'order')
      .leftJoinAndSelect('meal.restaurant', 'restaurant')
      .addSelect('COUNT(order.id)', 'orderscount')
      .where('meal.type = :businessType', { businessType })
      .andWhere('restaurant.isActive = true')
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
    const qb = this.countryRepo
      .createQueryBuilder('country')
      .leftJoinAndSelect(
        'country.restaurants',
        'restaurant',
        'restaurant.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('country.likes', 'countryLike')
      .leftJoinAndSelect('countryLike.user', 'likeUser')
      .orderBy('country.name', 'ASC')
      .distinct(true)
      .take(7);

    try {
      const [sql, params] = qb.getQueryAndParameters();
      console.log('[DEBUG arabicKitchens SQL]', sql);
      console.log('[DEBUG arabicKitchens params]', params);

      const totalCountries = await this.countryRepo.count();
      console.log('[DEBUG countries count]', totalCountries);

      const countriesWithActiveRestaurants = await this.countryRepo
        .createQueryBuilder('country')
        .leftJoin('country.restaurants', 'r', 'r.isActive = :isActive', {
          isActive: true,
        })
        .where('r.id IS NOT NULL')
        .getCount();
      console.log(
        '[DEBUG countries with active restaurants]',
        countriesWithActiveRestaurants,
      );
    } catch (err) {
      console.warn('[DEBUG arabicKitchens debug failed]', String(err ?? ''));
    }

    const arabicKitchens = await qb.getMany();

    const topRestaurants = await this.restRepo
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.likes', 'like')
      .leftJoinAndSelect('like.user', 'user')
      .where('restaurant.type = :businessType', { businessType })
      .andWhere('restaurant.isActive = true')
      .orderBy('restaurant.averageRating', 'DESC')
      .take(7)
      .getMany();

    const cheapestMealsQuery = this.mealRepo
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.restaurant', 'restaurant')
      .where('meal.type = :businessType', { businessType })
      .andWhere('restaurant.isActive = true')
      .addSelect('COALESCE(meal.price, 0)', 'coalesced_price')
      .orderBy('coalesced_price', 'ASC')
      .addOrderBy('meal.createdAt', 'DESC')
      .take(7);

    const cheapestMeals = await cheapestMealsQuery.getMany();
    for (const meal of cheapestMeals) {
      meal.likes = await this.mealRepo
        .createQueryBuilder()
        .relation(Meal, 'likes')
        .of(meal)
        .loadMany();
    }

    let recommendedByLastOrderCategory: Array<any> = [];
    if (userId) {
      const lastOrder = await this.orderRepo
        .createQueryBuilder('o')
        .leftJoin('o.user', 'ouser')
        .leftJoinAndSelect('o.items', 'item')
        .leftJoinAndSelect('item.meal', 'meal')
        .leftJoinAndSelect('meal.category', 'category')
        .leftJoinAndSelect('meal.restaurant', 'restaurant')
        .where('ouser.id = :userId', { userId })
        .andWhere('meal.type = :businessType', { businessType })
        .orderBy('o.createdAt', 'DESC')
        .getOne();

      const firstCategoryId = lastOrder?.items?.[0]?.meal?.category?.id;
      if (firstCategoryId) {
        const sameCategoryMeals = await this.mealRepo
          .createQueryBuilder('meal')
          .leftJoinAndSelect('meal.restaurant', 'restaurant')
          .leftJoin('meal.category', 'category')
          .where('meal.type = :businessType', { businessType })
          .andWhere('category.id = :categoryId', {
            categoryId: firstCategoryId,
          })
          .andWhere('restaurant.isActive = true')
          .orderBy('meal.createdAt', 'DESC')
          .take(7)
          .getMany();

        for (const meal of sameCategoryMeals) {
          meal.likes = await this.mealRepo
            .createQueryBuilder()
            .relation(Meal, 'likes')
            .of(meal)
            .loadMany();
        }

        recommendedByLastOrderCategory = sameCategoryMeals.map(
          (meal: Meal & { likes: any[] }) => ({
            id: meal.id,
            name: meal.name,
            image: meal.image_url,
            price: meal.price,
            duration: meal.preparationTime,
            restaurant: meal.restaurant
              ? { id: meal.restaurant.id, name: meal.restaurant.name }
              : null,
            isLiked: userId
              ? meal.likes.some((l) => l.user.id === userId)
              : false,
          }),
        );
      }
    }

    // ==== Nearby restaurants via DeliveryLocation (bounding box + haversine)
    let nearbyRestaurants: Array<any> = [];

    // if lat/lon not provided, try to use stored user coordinates
    if ((lat === undefined || lon === undefined) && userId) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user && user.latitude !== undefined && user.longitude !== undefined) {
        lat = Number(user.latitude);
        lon = Number(user.longitude);
      }
    }

    if (typeof lat === 'number' && typeof lon === 'number') {
      // bounding box deltas
      const radius = radiusKm;
      const deltaLat = radius / 111.32; // approx degrees
      const latRad = (lat * Math.PI) / 180;
      const deltaLon = radius / (111.32 * Math.cos(latRad));

      const latMin = lat - deltaLat;
      const latMax = lat + deltaLat;
      const lonMin = lon - deltaLon;
      const lonMax = lon + deltaLon;

      // fetch delivery locations within bbox and join restaurant
      const dlRows = await this.restRepo
        .createQueryBuilder('restaurant')
        .leftJoinAndSelect('restaurant.deliveryLocations', 'dl')
        .leftJoinAndSelect('restaurant.likes', 'like')
        .leftJoinAndSelect('like.user', 'likeUser')
        .where('restaurant.type = :businessType', { businessType })
        .andWhere('restaurant.isActive = true')
        .andWhere('dl.latitude BETWEEN :latMin AND :latMax', {
          latMin,
          latMax,
        })
        .andWhere('dl.longitude BETWEEN :lonMin AND :lonMax', {
          lonMin,
          lonMax,
        })
        .getMany();

      // restaurants may be returned with only the deliveryLocations that match due to leftJoinAndSelect
      const candidates: Array<{ restaurant: Restaurant; distanceKm: number }> =
        [];
      for (const r of dlRows) {
        if (!r.deliveryLocations || r.deliveryLocations.length === 0) continue;
        // compute min distance across delivery locations
        let minDist = Number.POSITIVE_INFINITY;
        for (const dl of r.deliveryLocations) {
          const d = this.haversineKm(
            lat,
            lon,
            Number(dl.latitude),
            Number(dl.longitude),
          );
          if (d < minDist) minDist = d;
        }
        if (minDist <= radius) {
          candidates.push({ restaurant: r, distanceKm: minDist });
        }
      }

      // unique restaurants by id and sort by distance
      const uniq = new Map<string, { r: Restaurant; distanceKm: number }>();
      for (const c of candidates) {
        const id = c.restaurant.id;
        const existing = uniq.get(id);
        if (!existing || c.distanceKm < existing.distanceKm) {
          uniq.set(id, { r: c.restaurant, distanceKm: c.distanceKm });
        }
      }

      nearbyRestaurants = Array.from(uniq.values())
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 20)
        .map(({ r, distanceKm }) => ({
          id: r.id,
          name: r.name,
          logoUrl: r.logo_url,
          distanceKm,
          isLiked: userId ? r.likes.some((l) => l.user?.id === userId) : false,
          likesCount: r.likes ? r.likes.length : 0,
        }));
    }

    return {
      favoriteMeals: meals.map((meal: Meal & { likes: any[] }) => ({
        id: meal.id,
        name: meal.name,
        image: meal.image_url,
        duration: meal.preparationTime,
        restaurant: meal.restaurant
          ? {
              id: meal.restaurant.id,
              name: meal.restaurant.name,
              image: meal.restaurant.mainImage,
              logoUrl: meal.restaurant.logo_url,
            }
          : null,
        isLiked: userId ? meal.likes.some((l) => l.user.id === userId) : false,
        likesCount: meal.likes ? meal.likes.length : 0,
      })),
      arabicKitchens: arabicKitchens.map((country) => ({
        id: country.id,
        name: country.name,
        image: country.imageUrl,
        logoImage: country.logoImage,
        isLiked: userId
          ? country.likes.some((l) => l.user.id === userId)
          : false,
        likesCount: country.likes ? country.likes.length : 0,
      })),
      recommendedRestaurants: topRestaurants.map((r) => ({
        id: r.id,
        name: r.name,
        logoUrl: r.logo_url,
        Image: r.mainImage,
        description: r.description,
        rating: r.averageRating,
        isLiked: userId ? r.likes.some((l) => l.user?.id === userId) : false,
        likesCount: r.likes ? r.likes.length : 0,
      })),
      cheap: cheapestMeals.map((meal: Meal & { likes: any[] }) => ({
        id: meal.id,
        name: meal.name,
        image: meal.image_url,
        price: meal.price,
        duration: meal.preparationTime,
        restaurant: meal.restaurant
          ? { id: meal.restaurant.id, name: meal.restaurant.name }
          : null,
        isLiked: userId ? meal.likes.some((l) => l.user.id === userId) : false,
        likesCount: meal.likes ? meal.likes.length : 0,
      })),
      recommendedByLastOrderCategory,
      nearbyRestaurants,
    };
  }

  async getFeed(businessType: BusinessType, userId?: string) {
    // Posts by business type with reactions summary and user reaction
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.restaurant', 'restaurant')
      .leftJoinAndSelect('post.reactions', 'reaction')
      .leftJoinAndSelect('reaction.user', 'reactionUser')
      .where('post.businessType = :businessType', { businessType })
      .andWhere('restaurant.isActive = true')
      .orderBy('post.createdAt', 'DESC')
      .getMany();

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
            restaurant: { id: In(followedRestaurantIds), isActive: true },
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
