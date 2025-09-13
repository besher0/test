/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { User } from 'src/user/user.entity';
import { Category } from 'src/category/category.entity';

// واجهة Response مخصصة
export interface RestaurantResponse extends Omit<Restaurant, 'owner'> {
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    userType: string;
    email: string;
  };
}

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

  private mapOwner(user: User) {
      if (!user) return null;
console.log(user)
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      email: user.email,
    };
  }

  async create(dto: CreateRestaurantDto, currentUser: User) {
    console.log(currentUser)

    if (currentUser.userType !== 'restaurant') {
      throw new NotFoundException('Only restaurant owners can create restaurants');
    }

    // let category: Category | null = null;
    // if (dto.categoryId) {
    //   category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    //   if (!category) throw new NotFoundException('Category not found');
    // }
      const owner = await this.userRepo.findOne({ where: { id: currentUser.id } });
      console.log('[Service.create] owner from DB =', owner && { id: owner.id, userType: owner.userType });

  if (!owner) throw new NotFoundException('Owner not found');
    const restaurant = this.restaurantRepo.create({
      ...dto,
      owner,
    });

    const saved = await this.restaurantRepo.save(restaurant);

 return {
      ...saved,
      owner: this.mapOwner(owner), // ✅ مالك كامل
  };
  }

  async findAll() {
  const restaurants = await this.restaurantRepo.find({
    relations: ['owner', 'category'], // ✅ بس
  });

  return restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    location: r.location,
    Identity: r.Identity,
    logo_url: r.logo_url,
    averageRating: r.averageRating,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    owner: this.mapOwner(r.owner), // ✅ خلي المالك كامل
  }));;
}


  async findOne(id: string){
    const restaurant = await this.restaurantRepo.findOne({
      where: { id },
      relations: ['owner', 'category'],
    
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

  return {
    id: restaurant.id,
    name: restaurant.name,
    location: restaurant.location,
    Identity: restaurant.Identity,
    logo_url: restaurant.logo_url,
    averageRating: restaurant.averageRating,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt,
    owner: this.mapOwner(restaurant.owner),
  };
  }

  async update(id: string, dto: UpdateRestaurantDto){
    const restaurant = await this.restaurantRepo.findOne({
      where: { id },
      relations: ['owner', 'category'],
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      restaurant.category = category ?? null;
    }

    Object.assign(restaurant, dto);
    const updated = await this.restaurantRepo.save(restaurant);

    return {
      ...updated,
      owner: this.mapOwner(updated.owner),
    };
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.restaurantRepo.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    await this.restaurantRepo.remove(restaurant);
  }

  async findAllSortedByRating(order: 'ASC' | 'DESC' = 'DESC') {
    const restaurants = await this.restaurantRepo.find({
      order: { averageRating: order },
      relations: ['meals', 'owner', 'category'],
      select: {
        id: true,
        name: true,
        location: true,
        Identity: true,
        logo_url: true,
        category: { id: true },
        averageRating: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          id: true,
          userType: true,
          firstName: true,
          lastName: true,
          email: true, // ✅ أضفناها
        },
      },
    });

    return restaurants.map((r) => ({
      ...r,
      owner: this.mapOwner(r.owner),
    }));
  }
}
