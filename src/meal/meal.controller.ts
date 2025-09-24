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
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';

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
  @ApiOperation({ summary: 'Create meal with optional image' })
  @ApiResponse({ status: 201, description: 'Meal created' })
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
  async create(
    @Body() dto: CreateMealDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.mealService.create(dto, file);
  }
  @UseGuards(OptionalAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Get all meals' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll(@CurrentUser() user: User) {
    return this.mealService.findAll(user);
  }
  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Get meal by id' })
  @ApiResponse({ status: 200, description: 'Success' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.mealService.findOne(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update meal with optional image' })
  @ApiResponse({ status: 200, description: 'Meal updated' })
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
    @UploadedFile() file?: Express.Multer.File,
    // ✅ إضافة باراميتر المستخدم
  ): Promise<Meal> {
    return this.mealService.update(id, dto, user, file); // ✅ تمرير المستخدم إلى الخدمة
  }

  // في دالة الحذف (remove)
  @Delete(':id')
  @ApiOperation({ summary: "Delete (':id')".trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    // ✅ إضافة باراميتر المستخدم
    return this.mealService.remove(id, user); // ✅ تمرير المستخدم إلى الخدمة
  }
}
