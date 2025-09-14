/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './follow.entity';
import { User } from 'src/user/user.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
  ) {}

  async toggleFollow(user: User, restaurantId: string) {
    const restaurant = await this.restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const existing = await this.followRepo.findOne({
      where: { user: { id: user.id }, restaurant: { id: restaurantId } },
    });

    if (existing) {
      await this.followRepo.remove(existing);
      return { followed: false, restaurantId };
    } else {
      const follow = this.followRepo.create({
        user: { id: user.id } as User,   // ✅ أهم تعديل
        restaurant,
      });
      await this.followRepo.save(follow);
      return { followed: true, restaurantId };
    }
  }

  async getFollowedRestaurants(user: User) {
    const follows = await this.followRepo.find({
      where: { user: { id: user.id } },
      relations: ['restaurant'],
    });

    return follows.map((f) => f.restaurant);
  }

}
