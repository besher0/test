/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param,  Delete, Put, UseGuards, UploadedFile, UseInterceptors, UploadedFiles, Query,  } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiNotFoundResponse,ApiConsumes, ApiOkResponse, ApiBearerAuth, ApiParam, ApiQuery,  } from '@nestjs/swagger';
import { Restaurant } from './restaurant.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { RestaurantGuard } from 'src/auth/guards/restaurant.guard';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';


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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiConsumes('multipart/form-data')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'mainImageFile', maxCount: 1 },
  { name: 'logoFile', maxCount: 1 },
]))  @ApiOperation({ summary: 'Update restaurant details (any field optional)' })
  @ApiResponse({ status: 200, type: Restaurant })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'مطبخ نور' },
      location: { type: 'string', example: 'الرياض - السعودية' },
      description: { type: 'string', example: 'أطبخ لكم ألذ الأكلات الشعبية' },
      workingHours: { type: 'string', example: 'من الساعة 12 ظهراً إلى 9 مساءً' },
      countryId: { type: 'string', example: '33333333-3333-4333-8333-333333333333' },
      categoryId: { type: 'string', example: '44444444-4444-4444-4444-444444444444' },
      mainImageFile: { type: 'string', format: 'binary' },
      logoFile: { type: 'string', format: 'binary' },
    },
  },
})
  async updateRestaurant(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @UploadedFiles() files: {
    mainImageFile?: Express.Multer.File[],
    logoFile?: Express.Multer.File[],
  },
  ): Promise<Restaurant> {
    return this.restaurantService.updateRestaurant(
      id,
      dto,
      files.mainImageFile?.[0],
      files.logoFile?.[0],);
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

  // restaurant.controller.ts
@Get(':id/profile')
@ApiParam({ name: 'id', type: String, description: 'معرف المطعم' })
async getProfile(@Param('id') id: string) {
  return this.restaurantService.getRestaurantProfile(id);
}

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get all reviews of a restaurant (ratings + avg + count)' })
  @ApiResponse({ status: 200, description: 'List of reviews with avg rating and count' })
  async getRestaurantReviews(@Param('id') id: string) {
    return this.restaurantService.getRestaurantReviews(id);
  }

    @Get(':id/dishes')
    @ApiQuery({ name: 'categoryId', required: false })
  async getRestaurantDishes(
    @Param('id') restaurantId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.restaurantService.getRestaurantDishes(restaurantId, categoryId);
  }

  @ApiParam({ name: 'restaurantId', type: String, description: 'Restaurant ID' })
  @Get(':restaurantId/images')
  getImages(@Param('restaurantId') restaurantId: string) {
    return this.restaurantService.getImages(restaurantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'restaurantId', type: String, description: 'Restaurant ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })  @Post(':restaurantId/images')
  @UseInterceptors(FileInterceptor('file'))
  addImage(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: User,
@UploadedFile() file: Express.Multer.File,  ) {
    return this.restaurantService.addImage(restaurantId, user.id, file);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'imageId', type: String, description: 'Image ID' })
  @Delete('images/:imageId')
  deleteImage(@Param('imageId') imageId: string, @CurrentUser() user: User) {
    return this.restaurantService.deleteImage(imageId, user.id);
  }

@ApiParam({ name: 'restaurantId', type: String, description: 'Restaurant ID' })
  @Get(':restaurantId/videos')
  getVideos(@Param('restaurantId') restaurantId: string) {
    return this.restaurantService.getVideos(restaurantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'restaurantId', type: String, description: 'Restaurant ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post(':restaurantId/videos')
@UseInterceptors(FileInterceptor('file'))
  addVideo(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: User,
@UploadedFile() file: Express.Multer.File,
  ) {
    return this.restaurantService.addVideo(restaurantId, user.id, file);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'videoId', type: String, description: 'Video ID' })
  @Delete('videos/:videoId')
  deleteVideo(@Param('videoId') videoId: string, @CurrentUser() user: User) {
    return this.restaurantService.deleteVideo(videoId, user.id);
  }
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