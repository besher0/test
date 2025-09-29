import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Order } from '../order/order.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { Category } from '../category/category.entity';
import { Country } from '../country/county.entity';
import { Post } from '../post/post.entity';
import { BusinessType } from '../common/business-type.enum';

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
  ) {}

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
