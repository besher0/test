import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meal } from './meal.entity';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { BusinessType } from 'src/common/business-type.enum';
import { Category } from 'src/category/category.entity';
import { User } from 'src/user/user.entity';
import { Country } from 'src/country/county.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Meal)
    private mealRepo: Repository<Meal>,
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Country)
    private countryRepo: Repository<Country>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async getMealsByUserPreference(userId: string): Promise<Meal[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.favoriteFood) {
      return this.mealRepo.find({
        relations: ['restaurant', 'category'],
        order: { name: 'ASC' },
      });
    }

    const meals = await this.mealRepo
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.restaurant', 'restaurant')
      .leftJoinAndSelect('meal.category', 'category')
      .addSelect(
        `
      CASE 
        WHEN category.name = :favoriteFood THEN 0
        ELSE 1
      END
    `,
        'customOrder',
      )
      .orderBy('customOrder', 'ASC')
      .addOrderBy('meal.name', 'ASC')
      .setParameter('favoriteFood', user.favoriteFood)
      .getMany();

    return meals;
  }

  async create(
    dto: CreateMealDto,
    type: BusinessType,
    file?: Express.Multer.File,
  ): Promise<Meal> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: dto.restaurantId, type },
    });
    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant/Store with id ${dto.restaurantId} and type ${dto.type} not found`,
      );
    }
    let category: Category | undefined;
    if (dto.categoryId) {
      const foundCategory = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      category = foundCategory ?? undefined;
    }

    let country: Country | undefined;
    if (dto.countryId) {
      const foundCountry = await this.countryRepo.findOne({
        where: { id: dto.countryId },
      });
      country = foundCountry ?? undefined;
    }
    let image_url: string | undefined;
    if (file) {
      const result = await this.cloudinaryService.uploadImage(
        file,
        `meals/${dto.name}`,
      );
      image_url = result.secure_url;
    }
    const meal = this.mealRepo.create({
      ...dto,
      type,
      restaurant,
      category,
      country,
      image_url,
    });

    return this.mealRepo.save(meal);
  }

  async findAll(user: User, type: BusinessType): Promise<{ meals: any[] }> {
    const meals = await this.mealRepo.find({
      where: { type },
      relations: [
        'restaurant',
        'restaurant.owner',
        'restaurant.country',
        'category',
        'likes',
      ],
    });

    const mapped = meals.map((meal) => {
      const rest = meal.restaurant;
      const restaurantFull = rest
        ? {
            id: rest.id,
            name: rest.name,
            location: rest.location,
            latitude: rest.latitude,
            longitude: rest.longitude,
            Identity: rest.Identity,
            logo_url: rest.logo_url,
            mainImage: rest.mainImage,
            description: rest.description,
            workingHours: rest.workingHours,
            type: rest.type,
            averageRating: rest.averageRating,
            createdAt: rest.createdAt,
            updatedAt: rest.updatedAt,
            owner: rest.owner
              ? {
                  id: rest.owner.id,
                  firstName: rest.owner.firstName,
                  lastName: rest.owner.lastName,
                }
              : null,
            country: rest.country
              ? { id: rest.country.id, name: rest.country.name }
              : null,
            category: rest.category
              ? { id: rest.category.id, name: rest.category.name }
              : null,
          }
        : null;

      return {
        id: meal.id,
        name: meal.name,
        image: meal.image_url,
        restaurant: restaurantFull,
        category: {
          id: meal.category?.id,
          name: meal.category?.name,
        },
        isLiked: user
          ? meal.likes.some((like) => like.user.id === user.id)
          : false,
      };
    });

    return { meals: mapped };
  }

  async findOne(id: string, user: User, type: BusinessType): Promise<any> {
    const meal = await this.mealRepo.findOne({
      where: { id, type },
      relations: ['restaurant', 'category', 'likes'],
    });

    if (!meal) throw new NotFoundException('Meal not found');

    return {
      id: meal.id,
      name: meal.name,
      image: meal.image_url,
      description: meal.description,
      price: meal.price,
      preparationTime: meal.preparationTime,
      restaurant: {
        id: meal.restaurant?.id,
        name: meal.restaurant?.name,
        image: meal.restaurant.mainImage,
        logoUrl: meal.restaurant.logo_url,
      },
      category: {
        id: meal.category?.id,
        name: meal.category?.name,
      },
      isLiked: user
        ? meal.likes.some((like) => like.user.id === user.id)
        : false,
    };
  }

  async update(
    id: string,
    dto: UpdateMealDto,
    user: User, // ✅ إضافة باراميتر المستخدم
    type: BusinessType,
    file?: Express.Multer.File,
  ): Promise<Meal> {
    const meal = await this.mealRepo.findOne({
      where: { id, type },
      relations: ['category', 'restaurant'],
    });
    if (!meal) throw new NotFoundException('Meal/Product not found');

    if (dto.restaurantId) {
      const restaurant = await this.restaurantRepo.findOne({
        where: { id: dto.restaurantId, type: dto.type ?? type },
      });
      if (!restaurant) {
        throw new NotFoundException(
          `Restaurant/Store with id ${dto.restaurantId} not found`,
        );
      }
      meal.restaurant = restaurant;
    }
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOneBy({
        id: dto.categoryId,
      });
      meal.category = category ?? undefined;
    }

    Object.assign(meal, dto);

    if (file) {
      const result = await this.cloudinaryService.uploadImage(
        file,
        `meals/${meal.name}`,
      );
      meal.image_url = result.secure_url;
    }
    return this.mealRepo.save(meal);
  }

  // في دالة الحذف (remove)
  async remove(id: string, user: User, type: BusinessType): Promise<void> {
    const meal = await this.mealRepo.findOne({ where: { id, type } });
    if (!meal) throw new NotFoundException('Meal not found');
    await this.mealRepo.remove(meal);
  }
}
