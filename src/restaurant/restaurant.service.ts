/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { User } from 'src/user/user.entity';
import { Category } from 'src/category/category.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateRestaurantDto): Promise<Restaurant> {
    const owner = await this.userRepo.findOne({ where: { id: dto.ownerId } });
    if (!owner) throw new NotFoundException('Owner not found');

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    }

    const restaurant = this.restaurantRepo.create({
      name: dto.name,
      location: dto.location,
      owner,
      category,
    });

    return this.restaurantRepo.save(restaurant);
  }

  async findAll(): Promise<Restaurant[]> {
    return this.restaurantRepo.find({
      relations: ['owner', 'category'],
    });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id },
      relations: ['owner', 'category'],
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      restaurant.category = category ?? null;
    }

    Object.assign(restaurant, dto);
    return this.restaurantRepo.save(restaurant);
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.findOne(id);
    await this.restaurantRepo.remove(restaurant);
  }
}
