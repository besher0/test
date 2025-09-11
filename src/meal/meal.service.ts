/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meal } from './meal.entity';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Category } from 'src/category/category.entity';

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Meal)
    private mealRepo: Repository<Meal>,
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateMealDto): Promise<Meal> {
    const restaurant = await this.restaurantRepo.findOne({ where: { id: dto.restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    let category: Category|undefined ;
    if (dto.categoryId) {
    const foundCategory = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    category = foundCategory ?? undefined;     }

    const meal = this.mealRepo.create({
      ...dto,
      restaurant,
      category,
    });

    return this.mealRepo.save(meal);
  }

  async findAll(): Promise<Meal[]> {
    return this.mealRepo.find({
      relations: ['restaurant', 'category'],
    });
  }

  async findOne(id: string): Promise<Meal> {
    const meal = await this.mealRepo.findOne({
      where: { id },
      relations: ['restaurant', 'category'],
    });
    if (!meal) throw new NotFoundException('Meal not found');
    return meal;
  }

  async update(id: string, dto: UpdateMealDto): Promise<Meal> {
    const meal = await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOneBy({ id: dto.categoryId });
      meal.category = category ?? undefined;
    }

    Object.assign(meal, dto);
    return this.mealRepo.save(meal);
  }

  async remove(id: string): Promise<void> {
    const meal = await this.findOne(id);
    await this.mealRepo.remove(meal);
  }
}
