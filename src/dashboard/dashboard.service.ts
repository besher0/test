import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Order } from '../order/order.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { Category } from '../category/category.entity';
import { Country } from '../country/county.entity';
import { Post } from '../post/post.entity';
import { BusinessType } from '../common/business-type.enum';
import { Story } from '../story/story.entity';
import { RestaurantVideo } from '../restaurant/restaurant-video.entity';

type Range = { from?: Date; to?: Date };

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(RestaurantVideo)
    private readonly videoRepo: Repository<RestaurantVideo>,
  ) {}

  // 1) Admin home page widgets
  async getAdminHomePage() {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    const [usersTotal, restaurantsTotal, storesTotal, ordersTotal] =
      await Promise.all([
        this.userRepo.count({ where: { userType: 'normalUser' } }),
        this.restaurantRepo.count({ where: { type: BusinessType.RESTAURANT } }),
        this.restaurantRepo.count({ where: { type: BusinessType.STORE } }),
        this.orderRepo.count(),
      ]);

    const [usersPrev, restaurantsPrev, storesPrev, ordersPrev] =
      await Promise.all([
        this.userRepo.count({
          where: {
            userType: 'normalUser',
            createdAt: MoreThanOrEqual(monthAgo),
          },
        }),
        this.restaurantRepo.count({
          where: {
            type: BusinessType.RESTAURANT,
            createdAt: MoreThanOrEqual(monthAgo),
          },
        }),
        this.restaurantRepo.count({
          where: {
            type: BusinessType.STORE,
            createdAt: MoreThanOrEqual(monthAgo),
          },
        }),
        this.orderRepo.count({
          where: { createdAt: MoreThanOrEqual(monthAgo) },
        }),
      ]);

    const pct = (curr: number, prev: number) => {
      if (!prev) return 100; // consider full growth if no previous period
      return Math.round(((curr - prev) / prev) * 100);
    };

    const topRated = await this.restaurantRepo.find({
      where: { isActive: true },
      order: { averageRating: 'DESC' },
      take: 5,
    });

    return {
      counts: {
        users: {
          total: usersTotal,
          growthPctLastMonth: pct(usersTotal, usersPrev),
        },
        restaurants: {
          total: restaurantsTotal,
          growthPctLastMonth: pct(restaurantsTotal, restaurantsPrev),
        },
        stores: {
          total: storesTotal,
          growthPctLastMonth: pct(storesTotal, storesPrev),
        },
        orders: {
          total: ordersTotal,
          growthPctLastMonth: pct(ordersTotal, ordersPrev),
        },
      },
      topRatedRestaurants: topRated.map((r) => ({
        id: r.id,
        name: r.name,
        averageRating: r.averageRating ?? 0,
        type: r.type,
      })),
    };
  }

  // 2) Account management unified endpoint
  async getAccountManagement({
    userType,
    page = 1,
    limit = 10,
  }: {
    userType: 'normalUser' | 'restaurant' | 'store';
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;
    if (userType === 'normalUser') {
      const [items, total] = await this.userRepo.findAndCount({
        where: { userType: 'normalUser' },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });
      return {
        items: items.map((u) => ({
          id: u.id,
          fullName: `${u.firstName} ${u.lastName}`.trim(),
          userType: u.userType,
          city: u.city ?? null,
          active: true, // normal users assumed active if exist; extend if you have status
          createdAt: u.createdAt,
        })),
        total,
        page,
        limit,
      };
    }

    // restaurants or stores
    const type =
      userType === 'restaurant' ? BusinessType.RESTAURANT : BusinessType.STORE;
    const qb = this.restaurantRepo
      .createQueryBuilder('r')
      .leftJoin('r.owner', 'o')
      .leftJoin('r.ratings', 'rat')
      .leftJoin('r.meals', 'm')
      .leftJoin('r.country', 'c')
      .leftJoin('r.videos', 'v')
      .leftJoin('r.posts', 'p')
      .where('r.type = :type', { type })
      .select([
        'r.id as id',
        'r.name as name',
        'r.isActive as isActive',
        'r.averageRating as averageRating',
      ])
      .addSelect(
        'COALESCE((SELECT COUNT(*) FROM "order" o2 WHERE o2."restaurantId" = r.id), 0)',
        'ordersCount',
      )
      .addSelect("COALESCE(c.name, '')", 'city')
      .orderBy('r.createdAt', 'DESC')
      .offset(skip)
      .limit(limit);

    const rows = await qb.getRawMany<{
      id: string;
      name: string;
      isActive: boolean;
      averageRating: number;
      ordersCount: string;
      city: string;
    }>();

    const total = await this.restaurantRepo.count({ where: { type } });
    return {
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        userType,
        city: r.city || null,
        ordersCount: Number(r.ordersCount || 0),
        status: r.isActive ? 'active' : 'inactive',
        averageRating: Number(r.averageRating || 0),
      })),
      total,
      page,
      limit,
    };
  }

  // 3) Content moderation endpoint
  async getContent({
    type,
    page = 1,
    limit = 24,
  }: {
    type: 'posts' | 'reels' | 'stories';
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;
    if (type === 'posts') {
      const [items, total] = await this.postRepo.findAndCount({
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
        relations: ['restaurant', 'restaurant.owner'],
      });
      return {
        items: items.map((p) => ({
          id: p.id,
          mediaUrl: p.mediaUrl,
          thumbnailUrl: p.thumbnailUrl,
          caption: p.text,
          createdAt: p.createdAt,
          owner: p.restaurant?.owner
            ? {
                id: p.restaurant.owner.id,
                name: `${p.restaurant.owner.firstName} ${p.restaurant.owner.lastName}`.trim(),
              }
            : null,
        })),
        total,
        page,
        limit,
      };
    }
    if (type === 'stories') {
      const [items, total] = await this.storyRepo.findAndCount({
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
        relations: ['restaurant', 'restaurant.owner'],
      });
      return {
        items: items.map((s) => ({
          id: s.id,
          mediaUrl: s.mediaUrl,
          thumbnailUrl: s.thumbnailUrl,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          owner: s.restaurant?.owner
            ? {
                id: s.restaurant.owner.id,
                name: `${s.restaurant.owner.firstName} ${s.restaurant.owner.lastName}`.trim(),
              }
            : null,
        })),
        total,
        page,
        limit,
      };
    }
    // reels = all videos regardless of businessType or restaurant
    const [items, total] = await this.videoRepo.findAndCount({
      order: { id: 'DESC' },
      skip,
      take: limit,
    });
    return {
      items: items.map((v) => ({
        id: v.id,
        mediaUrl: (v as unknown as { videoUrl?: string }).videoUrl,
      })),
      total,
      page,
      limit,
    };
  }

  async getOverview({
    businessType,
    from,
    to,
  }: { businessType?: BusinessType } & Range) {
    // totals
    const [totalUsers, totalRestaurants, totalOrders] = await Promise.all([
      this.userRepo.count(),
      businessType
        ? this.restaurantRepo.count({ where: { type: businessType } })
        : this.restaurantRepo.count(),
      this.orderRepo.count(
        from && to ? { where: { createdAt: Between(from, to) } } : undefined,
      ),
    ]);

    // revenue and orders in range (optional)
    const ordersQb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoin('o.restaurant', 'r');

    if (businessType) {
      ordersQb.andWhere('r.type = :bt', { bt: businessType });
    }
    if (from) ordersQb.andWhere('o.createdAt >= :from', { from });
    if (to) ordersQb.andWhere('o.createdAt <= :to', { to });

    const revenueRow = await ordersQb
      .select('COALESCE(SUM(o.totalPrice), 0)', 'revenue')
      .addSelect('COUNT(o.id)', 'orders')
      .getRawOne<{ revenue: string; orders: string }>();

    const revenue = Number(revenueRow?.revenue ?? 0);
    const ordersInRange = Number(revenueRow?.orders ?? 0);

    // new restaurants in range
    const newRestaurants = await this.restaurantRepo.count(
      from && to
        ? {
            where: {
              createdAt: Between(from, to),
              ...(businessType ? { type: businessType } : {}),
            },
          }
        : businessType
          ? { where: { type: businessType } }
          : undefined,
    );

    // posts today (or in range)
    const postsQb = this.postRepo.createQueryBuilder('p').where('1=1');
    if (businessType)
      postsQb.andWhere('p.businessType = :bt', { bt: businessType });
    if (from) postsQb.andWhere('p.createdAt >= :from', { from });
    if (to) postsQb.andWhere('p.createdAt <= :to', { to });
    const postsCount = await postsQb.getCount();

    return {
      totals: {
        users: totalUsers,
        restaurants: totalRestaurants,
        orders: totalOrders,
      },
      range: {
        from: from ?? null,
        to: to ?? null,
        businessType: businessType ?? null,
      },
      kpis: {
        revenue,
        orders: ordersInRange,
        newRestaurants,
        posts: postsCount,
      },
    };
  }

  async getTopRestaurants({
    businessType,
    metric = 'orders',
    limit = 7,
    from,
    to,
  }: {
    businessType: BusinessType;
    metric?: 'orders' | 'revenue';
    limit?: number;
  } & Range) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoin('o.restaurant', 'r')
      .where('r.type = :bt', { bt: businessType });

    if (from) qb.andWhere('o.createdAt >= :from', { from });
    if (to) qb.andWhere('o.createdAt <= :to', { to });

    if (metric === 'revenue') {
      qb.select('r.id', 'id')
        .addSelect('r.name', 'name')
        .addSelect('COALESCE(SUM(o.totalPrice), 0)', 'value')
        .groupBy('r.id')
        .addGroupBy('r.name')
        .orderBy('value', 'DESC');
    } else {
      qb.select('r.id', 'id')
        .addSelect('r.name', 'name')
        .addSelect('COUNT(o.id)', 'value')
        .groupBy('r.id')
        .addGroupBy('r.name')
        .orderBy('value', 'DESC');
    }

    const rows = await qb
      .limit(limit)
      .getRawMany<{ id: string; name: string; value: string }>();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      value: Number(r.value),
    }));
  }

  async getTopCategories({
    businessType,
    limit = 7,
  }: {
    businessType: BusinessType;
    limit?: number;
  }) {
    // count restaurants by category for the given business type
    const qb = this.restaurantRepo
      .createQueryBuilder('r')
      .leftJoin('r.category', 'c')
      .where('r.type = :bt', { bt: businessType })
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .addSelect('COUNT(r.id)', 'value')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .orderBy('value', 'DESC')
      .limit(limit);

    const rows = await qb.getRawMany<{
      id: string;
      name: string;
      value: string;
    }>();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      value: Number(r.value),
    }));
  }

  async getTopCountries({
    businessType,
    limit = 7,
  }: {
    businessType: BusinessType;
    limit?: number;
  }) {
    const qb = this.restaurantRepo
      .createQueryBuilder('r')
      .leftJoin('r.country', 'c')
      .where('r.type = :bt', { bt: businessType })
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .addSelect('COUNT(r.id)', 'value')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .orderBy('value', 'DESC')
      .limit(limit);

    const rows = await qb.getRawMany<{
      id: string;
      name: string;
      value: string;
    }>();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      value: Number(r.value),
    }));
  }
}
