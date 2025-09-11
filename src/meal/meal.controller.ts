/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';

@Controller('meals')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  create(@Body() dto: CreateMealDto) {
    return this.mealService.create(dto);
  }

  @Get()
  findAll() {
    return this.mealService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mealService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMealDto) {
    return this.mealService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mealService.remove(id);
  }
}
