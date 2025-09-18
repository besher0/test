/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Body,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { ReactToStoryDto } from './dto/react-to-story.dto';

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
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createStory(
    @CurrentUser() user: User,
    @Body() dto: CreateStoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.userType !== 'restaurant') {
      throw new ForbiddenException('Only restaurant owners can create stories');
    }
    const fileUrl = file?.path;
    const thumbnailUrl = file ? `thumbnail-of-${file.filename}` : undefined; // TODO: generate real thumbnail
    return this.storyService.createStory(user, dto, fileUrl, thumbnailUrl);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a story (only restaurant owners)' })
  @ApiParam({ name: 'id', type: String, description: 'Story ID' })
  @Patch(':id')
  async updateStory(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateStoryDto,
  ) {
    return this.storyService.updateStory(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a story (only restaurant owners)' })
  @ApiParam({ name: 'id', type: String, description: 'Story ID' })
  @Delete(':id')
  async deleteStory(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.storyService.deleteStory(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get stories from followed restaurants (48h expiry)' })
  @Get()
  async getStories(@CurrentUser() user: User) {
    return this.storyService.getStoriesForUser(user.id);
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
