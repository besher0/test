import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  UploadedFiles,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiConsumes,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BusinessType, Restaurant } from './restaurant.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { RestaurantGuard } from 'src/auth/guards/restaurant.guard';
// ...existing code... (removed unused Roles and RolesGuard imports)
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { RestaurantProfileDto } from './dto/RestaurantProfileDto';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { FilterService } from './filter.service';
import { isUUID } from 'class-validator';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly filterService: FilterService,
  ) {}
  @Post()
  @UseGuards(JwtAuthGuard, RestaurantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new restaurant' })
  @ApiConsumes('multipart/form-data') // 👈 مهم جداً
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'mainImage', maxCount: 1 },
      { name: 'identityImage1', maxCount: 1 },
      { name: 'identityImage2', maxCount: 1 },
    ]),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        location: { type: 'string' },
        description: { type: 'string' },
        workingHours: { type: 'string' },
        countryId: { type: 'string' },
        categoryId: { type: 'string' },
        logo_url: { type: 'string', format: 'binary' },
        mainImage: { type: 'string', format: 'binary' },
        latitude: { type: 'number', format: 'float' },
        longitude: { type: 'number', format: 'float' },
        identityImage1: { type: 'string', format: 'binary' },
        identityImage2: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiOkResponse({ type: Restaurant })
  create(
    @Body() dto: CreateRestaurantDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      mainImage?: Express.Multer.File[];
      identityImage1?: Express.Multer.File[];
      identityImage2?: Express.Multer.File[];
    },
    @CurrentUser() currentUser: User,
    @Query('type') type: BusinessType,
  ) {
    return this.restaurantService.create(
      dto,
      currentUser,
      files.logo?.[0],
      files.mainImage?.[0],
      type,
      files.identityImage1?.[0],
      files.identityImage2?.[0],
    );
  }

  //   @Get()
  // @ApiOperation({ summary: 'Get all restaurants' })
  //   @ApiOkResponse({
  //     type: [Restaurant],  // array من الـ Entity
  //     description: 'List of all restaurants'
  //   })
  //   @ApiResponse({
  //     status: 200,
  //     description: 'Success',
  //     schema: {
  //       example: [
  //         {
  //           id: '33333333-3333-4333-8333-333333333333',
  //           name: 'Italiano Pizza',
  //           location: '123 Main Street, New York',
  //           ownerId: '11111111-1111-4111-8111-111111111111',
  //           categoryId: '22222222-2222-4222-8222-222222222222',
  //           averageRating: 4.7,
  //           createdAt: '2025-09-13T10:00:00.000Z',
  //           updatedAt: '2025-09-13T10:00:00.000Z'
  //         }
  //       ]
  //     }
  //   })  findAll() {
  //     return this.restaurantService.findAll();
  //   }

  @Get('countries')
  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'جلب قائمة الدول مع الفلترة والبحث' })
  @ApiQuery({
    name: 'category',
    required: false,
    example: 'عربي',
    description: 'اسم التصنيف (Category) للدول',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'سوري',
    description: 'كلمة للبحث داخل اسم الدولة',
  })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  async getCountries(
    @CurrentUser() user: User | undefined,
    @Query('type') type: BusinessType,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const countries = await this.filterService.getCountries(
      type,
      category,
      search,
      user?.id,
    );
    return { country: countries };
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get('meals')
  @ApiOperation({ summary: 'جلب قائمة الوجبات مع الفلترة والبحث' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiQuery({ name: 'category', required: false, example: 'لحوم' })
  @ApiQuery({ name: 'search', required: false, example: 'برغر' })
  getMeals(
    @CurrentUser() user?: User,
    @Query('type') type?: BusinessType,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!type) {
      throw new BadRequestException(
        'type is required and must be restaurant or store',
      );
    }
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    // server enforces only active restaurants' meals
    const perPage = limit ? Math.max(1, Number(limit)) : 8;
    return this.filterService.getMeals(
      type,
      user?.id,
      category,
      search,
      pageNum,
      perPage,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a restaurant or store by ID' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiOkResponse({ type: Restaurant })
  @ApiNotFoundResponse({ description: 'Not found' })
  findOne(
    @Param('id') id: string,
    @Query('type') type: BusinessType,
    @CurrentUser() user?: User,
  ) {
    return this.restaurantService.findOne(id, type, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImageFile', maxCount: 1 },
      { name: 'logoFile', maxCount: 1 },
      { name: 'identityImage1', maxCount: 1 },
      { name: 'identityImage2', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Update restaurant details (any field optional)' })
  @ApiResponse({ status: 200, type: Restaurant })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'مطبخ نور' },
        location: { type: 'string', example: 'الرياض - السعودية' },
        description: {
          type: 'string',
          example: 'أطبخ لكم ألذ الأكلات الشعبية',
        },
        workingHours: {
          type: 'string',
          example: 'من الساعة 12 ظهراً إلى 9 مساءً',
        },
        countryId: {
          type: 'string',
          example: '33333333-3333-4333-8333-333333333333',
        },
        categoryId: {
          type: 'string',
          example: '44444444-4444-4444-4444-444444444444',
        },
        mainImageFile: { type: 'string', format: 'binary' },
        logoFile: { type: 'string', format: 'binary' },
        identityImage1: { type: 'string', format: 'binary' },
        identityImage2: { type: 'string', format: 'binary' },
      },
    },
  })
  async updateRestaurant(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @UploadedFiles()
    files: {
      mainImageFile?: Express.Multer.File[];
      logoFile?: Express.Multer.File[];
      identityImage1?: Express.Multer.File[];
      identityImage2?: Express.Multer.File[];
    },
  ): Promise<Restaurant> {
    return this.restaurantService.updateRestaurant(
      id,
      dto,
      files.mainImageFile?.[0],
      files.logoFile?.[0],
      files.identityImage1?.[0],
      files.identityImage2?.[0],
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a restaurant/store' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiOkResponse({ schema: { example: { message: 'Deleted successfully' } } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
    @Query('type') type: BusinessType,
    @CurrentUser() user: User,
  ) {
    return this.restaurantService.remove(id, type, user);
  }

  // restaurant.controller.ts
  @Get(':id/profile')
  @ApiOperation({ summary: 'Get restaurant/store profile' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiOkResponse({ type: RestaurantProfileDto })
  getProfile(@Param('id') id: string, @Query('type') type: BusinessType) {
    return this.restaurantService.getRestaurantProfile(id, type);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get(':id/upperProfile')
  @ApiOperation({ summary: 'Get upper profile for restaurant/store' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiOkResponse({ type: RestaurantProfileDto })
  getUpperProfile(
    @Param('id') id: string,
    @Query('type') type: BusinessType,
    @CurrentUser() user?: User,
  ) {
    return this.restaurantService.getRestaurantUpperProfile(id, type, user?.id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get reviews for restaurant/store' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  getReviews(
    @Param('id') id: string,
    @Query('type') type: BusinessType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const perPage = limit ? Math.max(1, Number(limit)) : 8;
    return this.restaurantService.getRestaurantReviews(
      id,
      type,
      pageNum,
      perPage,
    );
  }

  @Get(':id/dishes')
  @ApiOperation({ summary: 'Get dishes (restaurant) or products (store)' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiQuery({ name: 'categoryId', required: false })
  getDishes(
    @Param('id') id: string,
    @Query('type') type: BusinessType,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!type) {
      throw new BadRequestException(
        'type is required and must be restaurant or store',
      );
    }
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const perPage = limit ? Math.max(1, Number(limit)) : 8;
    return this.restaurantService.getRestaurantDishes(
      id,
      type,
      categoryId,
      pageNum,
      perPage,
    );
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Get restaurant/store images' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  getImages(
    @Param('id') id: string,
    @Query('type') type: BusinessType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const perPage = limit ? Math.max(1, Number(limit)) : 8;
    return this.restaurantService.getImages(id, type, pageNum, perPage);
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload a new image' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiBody({
    description: 'Upload image',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  addImage(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: BusinessType,
  ) {
    return this.restaurantService.addImage(id, type, user.id, file);
  }

  @Delete('images/:imageId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete image' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  deleteImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: User,
    @Query('type') type: BusinessType,
  ) {
    return this.restaurantService.deleteImage(imageId, type, user.id);
  }

  @Get(':id/videos')
  @ApiOperation({ summary: 'Get restaurant/store videos' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  getVideos(
    @Param('id') id: string,
    @Query('type') type: BusinessType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const perPage = limit ? Math.max(1, Number(limit)) : 8;
    return this.restaurantService.getVideos(id, type, pageNum, perPage);
  }

  @Post(':id/videos')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload a new video' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiBody({
    description: 'Upload video',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  addVideo(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: BusinessType,
  ) {
    return this.restaurantService.addVideo(id, type, user.id, file);
  }

  @Delete('videos/:videoId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete video' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  deleteVideo(
    @Param('videoId') videoId: string,
    @CurrentUser() user: User,
    @Query('type') type: BusinessType,
  ) {
    return this.restaurantService.deleteVideo(videoId, type, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'List restaurants or stores with filtering & search',
  })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  getRestaurants(
    @Query('type') type: BusinessType,
    @CurrentUser() user: User,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const perPage = limit ? Math.max(1, Number(limit)) : 8;
    return this.filterService.getRestaurants(
      type,
      user?.id,
      category,
      search,
      pageNum,
      perPage,
    );
  }

  // Simple endpoint: provide only countryId (path param) and get restaurants for that country
  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get('by-country/:countryId')
  @ApiOperation({
    summary:
      'Get restaurants by country id (no type required), paginated 8 per page',
  })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', enum: BusinessType, required: false })
  @ApiQuery({ name: 'page', required: false })
  async getRestaurantsByCountryId(
    @Param('countryId') countryId: string,
    @CurrentUser() user: User,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('type') type?: BusinessType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const cid = String(countryId ?? '').trim();
    if (!cid || !isUUID(cid)) {
      throw new BadRequestException(
        'countryId path param is required and must be a valid UUID',
      );
    }
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const limitNum = limit ? Math.max(1, Number(limit)) : 8;

    const res = await this.filterService.getRestaurantsByCountryAllTypes(
      cid,
      user?.id,
      category,
      search,
      pageNum,
      limitNum,
      type,
    );
    return res;
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
