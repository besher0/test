/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { Meal } from './meal.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('meals')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user-preference')
  @ApiOperation({ summary: "Get ('user-preference')".trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  async getMealsByUserPreference(@Req() req): Promise<Meal[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.mealService.getMealsByUserPreference(req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Post ()'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  create(@Body() dto: CreateMealDto) {
    return this.mealService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get ()'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll() {
    return this.mealService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: "Get (':id')".trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  findOne(@Param('id') id: string) {
    return this.mealService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: "Put (':id')".trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  update(@Param('id') id: string, @Body() dto: UpdateMealDto) {
    return this.mealService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Delete (':id')".trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  remove(@Param('id') id: string) {
    return this.mealService.remove(id);
  }
}
