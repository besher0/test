/* eslint-disable prettier/prettier */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { User } from 'src/user/user.entity';
import { Category } from 'src/category/category.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Country } from 'src/country/county.entity';
import { Rating } from 'src/rating/rating.entity';
import { Meal } from 'src/meal/meal.entity';

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
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    private readonly cloudinaryService: CloudinaryService, 
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
      @InjectRepository(Meal) private mealRepo: Repository<Meal>, 
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

  async create(dto: CreateRestaurantDto, currentUser: User ,file?: Express.Multer.File,) {
    console.log(currentUser)

    if (currentUser.userType !== 'restaurant') {
      throw new NotFoundException('Only restaurant owners can create restaurants');
    }

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
    }
      const owner = await this.userRepo.findOne({ where: { id: currentUser.id } });
      console.log('[Service.create] owner from DB =', owner && { id: owner.id, userType: owner.userType });

  if (!owner) throw new NotFoundException('Owner not found');
   let logo_url: string | undefined;
  if (file) {
    const result = await this.cloudinaryService.uploadImage(file, `restaurants/${dto.name}`);
    logo_url = result.secure_url;
  }
    const restaurant = this.restaurantRepo.create({
      ...dto,
      owner,
      logo_url
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

async updateRestaurant(
    id: string,
    dto: UpdateRestaurantDto,
      mainImageFile?: Express.Multer.File,
  logoFile?: Express.Multer.File,
  ): Promise<Restaurant> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id },
      relations: ['country', 'category'],
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    if (dto.name) restaurant.name = dto.name;
    if (dto.location) restaurant.location = dto.location;
    if (dto.description) restaurant.description = dto.description;
    if (dto.workingHours) restaurant.workingHours = dto.workingHours;

    if (dto.countryId) {
      const country = await this.countryRepo.findOne({ where: { id: dto.countryId } });
      if (!country) throw new NotFoundException('Country not found');
      restaurant.country = country;
    }

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
      restaurant.category = category;
    }

    // ✅ رفع الصورة الرئيسية لو تم رفع ملف
  if (mainImageFile) {
    const result = await this.cloudinaryService.uploadImage(mainImageFile, 'restaurants');
    restaurant.mainImage = result.secure_url;
  }

  // صورة اللوغو
  if (logoFile) {
    const result = await this.cloudinaryService.uploadImage(logoFile, 'restaurants/logo');
    restaurant.logo_url = result.secure_url;
  }

    return this.restaurantRepo.save(restaurant);
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

  async getRestaurantProfile(id: string) {
  const restaurant = await this.restaurantRepo.findOne({
    where: { id },
    relations: ['country', 'category'],
  });

  if (!restaurant) {
    throw new NotFoundException('Restaurant not found');
  }

  return {
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    logoUrl: restaurant.logo_url,
    mainImage: restaurant.mainImage,
    workingHours: restaurant.workingHours,
    country: restaurant.country
      ? {
          id: restaurant.country.id,
          name: restaurant.country.name,
          image: restaurant.country.logoImage, // لازم يكون عندك عمود image في country
        }
      : null,
    categories: restaurant.category
    ?{
      id: restaurant.category.id,
      name: restaurant.category.name,
      image: restaurant.category.image_url, // لازم يكون عندك عمود image في category
    }
    :null
  };
}

async getRestaurantReviews(restaurantId: string) {
      const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId },
      select: ['id', 'name', 'averageRating'],
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
  // نجيب كل التقييمات مع المستخدمين
  const ratings = await this.ratingRepo.find({
    where: { restaurant: { id: restaurantId } },
    relations: ['user'],
    order: { createdAt: 'DESC' },
  });

  // نجهّز الرد
  return {
    avgRating: restaurant.averageRating,
    totalReviewers: ratings.length,
    reviews: ratings.map((rating) => ({
      id: rating.id,
      score: rating.score,
      comment: rating.comment,
      createdAt: rating.createdAt,
      user: rating.user
        ? {
            id: rating.user.id,
            name: rating.user.firstName,
            profile_picture: rating.user.profile_picture ?? null,
          }
        : null,
    })),
  };
}
async getRestaurantDishes(restaurantId: string, categoryId?: string) {
  const query = this.mealRepo
    .createQueryBuilder('meal')
    .leftJoinAndSelect('meal.restaurant', 'restaurant')
    .leftJoinAndSelect('meal.category', 'category')
    .where('meal.restaurantId = :restaurantId', { restaurantId });

  if (categoryId) {
    query.andWhere('meal.categoryId = :categoryId', { categoryId });
  }

  return await query.getMany();
}

}
//316dd92a-bae2-4849-9eb5-a62447b4433a
//633288b7-dff1-4f5b-b88d-cf884d4da5c4
//720c1953-efdf-4ff4-8042-4967c35dd3f1