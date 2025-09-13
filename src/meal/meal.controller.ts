/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { Meal } from './meal.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('meals')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user-preference')
  async getMealsByUserPreference(@Req() req): Promise<Meal[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.mealService.getMealsByUserPreference(req.user);
  }

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

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMealDto) {
    return this.mealService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mealService.remove(id);
  }
}
