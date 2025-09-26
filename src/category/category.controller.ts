import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from '../category/dto/create-category.dto';
import { UpdateCategoryDto } from '../category/dto/update-category.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { Roles } from 'src/auth/decorator/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/auth/guards/roles.guard';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { videoStorage } from 'src/cloudinary.video/video-upload.storage';
import { BusinessType } from 'src/restaurant/restaurant.entity';

class FoodCategoryDto {
  name: string;
  imageUrl?: string;
}

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('food-categories')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('normalUser')
  @ApiOperation({
    summary: 'Get available favorite food categories with images',
  })
  @ApiResponse({
    status: 200,
    description: 'List of favorite food categories',
    type: [FoodCategoryDto],
  })
  async getFoodCategories() {
    return await this.categoryService.getFavoriteFoodCategories();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a category (with optional image)' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['restaurant', 'store'] },
        description: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.categoryService.create(createCategoryDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories (filter by type)' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAll(@Query('type') type?: BusinessType) {
    return this.categoryService.findAll(type);
  }

  // @Get(':userId')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get categories by user ID' })
  // @ApiResponse({ status: 200, description: 'List of categories' })
  // findByUser(@Param('userId') userId: number) {
  //   return this.categoryService.findByUser(userId);
  // }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Category details' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Updated category' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }

  @Post('food-categories/:name/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') // Restrict to admins; adjust roles as needed
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload image for a favorite food category' })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded and linked to category',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFoodCategoryImage(
    @Param('name') name: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string; imageUrl: string }> {
    return await this.categoryService.uploadCategoryImage(name, file);
  }
}
