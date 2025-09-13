/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody,  } from '@nestjs/swagger';


@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post()
  @ApiOperation({ summary: 'Post endpoint' })
  @ApiBody({ schema: { example: {"id": "33333333-3333-4333-8333-333333333333", "name": "Italiano Pizza", "location": "123 Main Street, New York", "ownerId": "11111111-1111-4111-8111-111111111111", "categoryId": "22222222-2222-4222-8222-222222222222"} } })
  @ApiResponse({ status: 201, description: 'Created', schema: { example: {"id": "33333333-3333-4333-8333-333333333333", "name": "Italiano Pizza", "location": "123 Main Street, New York", "ownerId": "11111111-1111-4111-8111-111111111111", "categoryId": "22222222-2222-4222-8222-222222222222"} } })
  create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get endpoint' })
  @ApiResponse({ status: 200, description: 'Success', schema: { example: {"id": "33333333-3333-4333-8333-333333333333", "name": "Italiano Pizza", "location": "123 Main Street, New York", "ownerId": "11111111-1111-4111-8111-111111111111", "categoryId": "22222222-2222-4222-8222-222222222222", "averageRating": 4.7} } })
  findAll() {
    return this.restaurantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get endpoint' })
  @ApiResponse({ status: 200, description: 'Success', schema: { example: {"id": "33333333-3333-4333-8333-333333333333", "name": "Italiano Pizza", "location": "123 Main Street, New York", "ownerId": "11111111-1111-4111-8111-111111111111", "categoryId": "22222222-2222-4222-8222-222222222222", "averageRating": 4.7} } })
  findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch endpoint' })
  @ApiBody({ schema: { example: {"id": "33333333-3333-4333-8333-333333333333", "name": "Italiano Pizza", "location": "123 Main Street, New York", "ownerId": "11111111-1111-4111-8111-111111111111", "categoryId": "22222222-2222-4222-8222-222222222222"} } })
  @ApiResponse({ status: 201, description: 'Created', schema: { example: {"id": "33333333-3333-4333-8333-333333333333", "name": "Italiano Pizza", "location": "123 Main Street, New York", "ownerId": "11111111-1111-4111-8111-111111111111", "categoryId": "22222222-2222-4222-8222-222222222222"} } })
  update(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete endpoint' })
  @ApiResponse({ status: 200, description: 'Success', schema: { example: {"id": "33333333-3333-4333-8333-333333333333", "name": "Italiano Pizza", "location": "123 Main Street, New York", "ownerId": "11111111-1111-4111-8111-111111111111", "categoryId": "22222222-2222-4222-8222-222222222222", "averageRating": 4.7} } })
  remove(@Param('id') id: string) {
    return this.restaurantService.remove(id);
  }

  @Get('sorted/by-rating')
  @ApiOperation({ summary: 'Get endpoint' })
  @ApiResponse({ status: 200, description: 'Success', schema: { example: {"id": "33333333-3333-4333-8333-333333333333", "name": "Italiano Pizza", "location": "123 Main Street, New York", "ownerId": "11111111-1111-4111-8111-111111111111", "categoryId": "22222222-2222-4222-8222-222222222222", "averageRating": 4.7} } })
  async getRestaurantsByRating(
  @Query('order') order: 'ASC' | 'DESC' = 'DESC',) {
    return this.restaurantService.findAllSortedByRating(order);
  } 

}
