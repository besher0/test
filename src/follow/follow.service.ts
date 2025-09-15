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

async toggleFollow(userId: string, restaurantId: string) {
  const user = await this.userRepo.findOne({ where: { id: userId } });
  const restaurant = await this.restaurantRepo.findOne({ where: { id: restaurantId } });

  if (!user || !restaurant) throw new NotFoundException('User or Restaurant not found');

  const existing = await this.followRepo.findOne({
    where: { user: { id: userId }, restaurant: { id: restaurantId } },
  });

  if (existing) {
    await this.followRepo.delete(existing.id);
    return { followed: false };
  }

  const follow = this.followRepo.create({ user, restaurant });
  await this.followRepo.save(follow);
  return { followed: true };
}


  async getFollowedRestaurants(userId: string) {
    const follows = await this.followRepo.find({
      where: { user: { id: userId } },
      relations: ['restaurant'],
    });

    return follows.map((f) => f.restaurant);
  }

}
