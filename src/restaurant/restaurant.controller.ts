/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param,  Delete, Put, UseGuards, UploadedFile, UseInterceptors,  } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiNotFoundResponse,ApiConsumes, ApiOkResponse, ApiBearerAuth,  } from '@nestjs/swagger';
import { Restaurant } from './restaurant.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { RestaurantGuard } from 'src/auth/guards/restaurant.guard';
import { FileInterceptor } from '@nestjs/platform-express';


@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    
  ) {}
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNkODhkNWQxLTY0ZmMtNDkzMy1hYzY2LTU1MTEwZjJjNzNmNSIsImVtYWlsIjoiam9obi5kb2VAZWNjeGFtcGxlLmNvbSIsInVzZXJUeXBlIjoicmVzdGF1cmFudCIsImlhdCI6MTc1Nzg1NTA1MSwiZXhwIjoxNzU3ODk4MjUxfQ.4lP0X4Kz-fynxF0QdJsYz8-DDsIJR0Kks620GroZq7w"
  @Post()
@UseGuards(JwtAuthGuard, RestaurantGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Create a new restaurant' })
@ApiConsumes('multipart/form-data') // 👈 مهم جداً
@UseInterceptors(FileInterceptor('file')) 
  @ApiBody({
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Italiano Pizza' },
      location: { type: 'string', example: '123 Main Street, New York' },
      Identity: { type: 'string', example: 'RESTAURANT-12345' },
      file: {
        type: 'string',
        format: 'binary', // 👈 هذا اللي يخلي Swagger يطلع زر Choose File
      },
    },
    required: ['name', 'location'],
  },
})
@ApiOkResponse({
  type: Restaurant,
  description: 'Restaurant created successfully',
})
  create(@Body() dto: CreateRestaurantDto,
  @UploadedFile() file: Express.Multer.File,
   @CurrentUser() currentUser: User) {
    return this.restaurantService.create(dto,currentUser,file);
  }

  @Get()
@ApiOperation({ summary: 'Get all restaurants' })
  @ApiOkResponse({ 
    type: [Restaurant],  // array من الـ Entity
    description: 'List of all restaurants'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Success',
    schema: { 
      example: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Italiano Pizza',
          location: '123 Main Street, New York',
          ownerId: '11111111-1111-4111-8111-111111111111',
          categoryId: '22222222-2222-4222-8222-222222222222',
          averageRating: 4.7,
          createdAt: '2025-09-13T10:00:00.000Z',
          updatedAt: '2025-09-13T10:00:00.000Z'
        }
      ] 
    }
  })  findAll() {
    return this.restaurantService.findAll();
  }

  @Get(':id')
@ApiOperation({ summary: 'Get a restaurant by ID' })
  @ApiOkResponse({ 
    type: Restaurant,
    description: 'Restaurant details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Success',
    schema: { 
      example: {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Italiano Pizza',
        location: '123 Main Street, New York',
        ownerId: '11111111-1111-4111-8111-111111111111',
        categoryId: '22222222-2222-4222-8222-222222222222',
        averageRating: 4.7,
        createdAt: '2025-09-13T10:00:00.000Z',
        updatedAt: '2025-09-13T10:00:00.000Z'
      } 
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Restaurant not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Restaurant not found',
        error: 'Not Found'
      }
    }
  })  findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a restaurant' })
  @ApiBody({ 
    type: UpdateRestaurantDto,  // يستخدم examples من الـ DTO
    description: 'Restaurant update data'
  })
  @ApiOkResponse({ 
    type: Restaurant,
    description: 'Restaurant updated successfully'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Updated',
    schema: { 
      example: {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Italiano Pizza Updated',
        location: '456 New Street, New York',
        ownerId: '11111111-1111-4111-8111-111111111111',
        categoryId: '22222222-2222-4222-8222-222222222222',
        averageRating: 4.8,
        createdAt: '2025-09-13T10:00:00.000Z',
        updatedAt: '2025-09-13T11:00:00.000Z'
      } 
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Restaurant not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Restaurant not found',
        error: 'Not Found'
      }
    }
  })
  update(@Param('id') id: string,
      @UploadedFile() file: Express.Multer.File,
   @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.update(id, dto,file);
  }

  @Delete(':id')
@ApiOperation({ summary: 'Delete a restaurant' })
  @ApiOkResponse({ 
    description: 'Restaurant deleted successfully',
    schema: {
      example: {
        message: 'Restaurant deleted successfully',
        id: '33333333-3333-4333-8333-333333333333'
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Success',
    schema: { 
      example: {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Italiano Pizza',
        location: '123 Main Street, New York',
        ownerId: '11111111-1111-4111-8111-111111111111',
        categoryId: '22222222-2222-4222-8222-222222222222',
        averageRating: 4.7
      } 
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Restaurant not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Restaurant not found',
        error: 'Not Found'
      }
    }
  })  remove(@Param('id') id: string) {
    return this.restaurantService.remove(id);
  }

  // @Get('sorted/by-rating')
  // @ApiOperation({ summary: 'Get restaurants sorted by rating' })
  // @ApiQuery({ 
  //   name: 'order', 
  //   enum: ['ASC', 'DESC'], 
  //   required: false, 
  //   description: 'Sort order (default: DESC)' 
  // })
  // @ApiOkResponse({ 
  //   type: [Restaurant],
  //   description: 'Restaurants sorted by rating'
  // })
  // @ApiResponse({ 
  //   status: 200, 
  //   description: 'Success',
  //   schema: { 
  //     example: [
  //       {
  //         id: '33333333-3333-4333-8333-333333333333',
  //         name: 'Italiano Pizza',
  //         location: '123 Main Street, New York',
  //         ownerId: '11111111-1111-4111-8111-111111111111',
  //         categoryId: '22222222-2222-4222-8222-222222222222',
  //         averageRating: 4.7,
  //         createdAt: '2025-09-13T10:00:00.000Z',
  //         updatedAt: '2025-09-13T10:00:00.000Z'
  //       }
  //     ] 
  //   }
  // })
  // async getRestaurantsByRating(
  // @Query('order') order: 'ASC' | 'DESC' = 'DESC',) {
  //   return this.restaurantService.findAllSortedByRating(order);
  // } 

}
