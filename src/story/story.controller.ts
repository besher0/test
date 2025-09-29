import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { ReactToStoryDto } from './dto/react-to-story.dto';
import { BusinessType } from 'src/common/business-type.enum';

@ApiTags('Stories')
@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a story (only restaurant owners)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        text: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  async createStory(
    @CurrentUser() user: User,
    @Body() dto: CreateStoryDto,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: BusinessType,
  ) {
    return this.storyService.createStory(user, dto, file, type);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a story (only restaurant owners)' })
  @ApiParam({ name: 'id', type: String, description: 'Story ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        text: { type: 'string' },
      },
    },
  })
  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateStory(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateStoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fileUrl = file?.path;
    const thumbnailUrl = file ? `thumbnail-of-${file.filename}` : undefined;

    return this.storyService.updateStory(user, id, dto, fileUrl, thumbnailUrl);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a story (only restaurant owners)' })
  @ApiParam({ name: 'id', type: String, description: 'Story ID' })
  @Delete(':id')
  async deleteStory(@Param('id') id: string, @CurrentUser() user: User) {
    return this.storyService.deleteStory(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get stories from followed restaurants (48h expiry)',
  })
  @Get()
  @ApiQuery({ name: 'type', enum: BusinessType, required: false })
  async getStories(
    @CurrentUser() user: User,
    @Query('type') type?: BusinessType,
  ) {
    return this.storyService.getStoriesForUser(user.id, type);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'React to a story (like, love, fire)' })
  @ApiParam({ name: 'id', type: String, description: 'Story ID' })
  @Post(':id/react')
  async reactToStory(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ReactToStoryDto,
  ) {
    return this.storyService.reactToStory(user, id, dto.type);
  }
}
