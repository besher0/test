import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { Meal } from './meal.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { BusinessType } from 'src/common/business-type.enum';

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

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  //@ApiBody({ type: CreateMealDto })
  @ApiQuery({ name: 'type', enum: BusinessType })
  @ApiOperation({ summary: 'Create meal/product with optional image' })
  @ApiResponse({ status: 201, description: 'Meal/Product created' })
  @UseInterceptors(FileInterceptor('image'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        restaurantId: { type: 'string' },
        categoryId: { type: 'string' },
        price: { type: 'number' },
        preparationTime: { type: 'string' },
        countryId: { type: 'string' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['name', 'restaurantId'],
    },
  })
  async create(
    @Body() dto: CreateMealDto,
    @Query('type') type: BusinessType,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.mealService.create(dto, type, file);
  }

  @UseGuards(OptionalAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Get all meals/products by type' })
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll(@CurrentUser() user: User, @Query('type') type: BusinessType) {
    return this.mealService.findAll(user, type);
  }
  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Get meal/product by id' })
  @ApiQuery({ name: 'type', enum: BusinessType })
  @ApiResponse({ status: 200, description: 'Meal/Product details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('type') type: BusinessType,
  ) {
    return this.mealService.findOne(id, user, type);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update meal/product by ID' })
  @ApiQuery({ name: 'type', enum: BusinessType })
  @ApiResponse({ status: 200, description: 'Meal/Product updated' })
  @UseInterceptors(FileInterceptor('image'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        restaurantId: { type: 'string' },
        categoryId: { type: 'string' },
        price: { type: 'number' },
        preparationTime: { type: 'string' },
        countryId: { type: 'string' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMealDto,
    @CurrentUser() user: User,
    @Query('type') type: BusinessType,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Meal> {
    return this.mealService.update(id, dto, user, type, file); // ✅ تمرير المستخدم إلى الخدمة
  }

  // في دالة الحذف (remove)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete meal/product by ID' })
  @ApiQuery({ name: 'type', enum: BusinessType })
  @ApiResponse({ status: 200, description: 'Meal/Product deleted' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('type') type: BusinessType,
  ) {
    return this.mealService.remove(id, user, type);
  }
}
