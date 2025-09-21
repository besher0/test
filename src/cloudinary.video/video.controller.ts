import {
  Controller,
  // Post,
  Get,
  // UseInterceptors,
  // UploadedFile,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { videoStorage } from './video-upload.storage';
import { VideoService } from './video.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('videos')
@Controller('videos')
export class VideoController {
  constructor(
    private videoService: VideoService,
    private cloudinaryService: CloudinaryService,
  ) {}

  //   @Post('upload')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  //   @UseInterceptors(FileInterceptor('file', { storage: videoStorage }))
  //   @ApiOperation({ summary: 'Upload a video' })
  //   @ApiResponse({ status: 201, description: 'Video uploaded' })
  //   async uploadVideo(
  //     @UploadedFile() file: Express.Multer.File,
  //     @Body('userId') userId: number,
  //   ) {
  //  const result = await this.cloudinaryService.uploadVideo(file, 'user_videos');
  // const { url, publicId } = result;
  // return this.videoService.createVideo({
  //   url,
  //   publicId,
  //   userId,
  // });
  //   }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all videos' })
  @ApiResponse({ status: 200, description: 'List of videos' })
  async getVideos() {
    return this.videoService.getAllVideos();
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get videos by user ID' })
  @ApiResponse({ status: 200, description: 'List of user videos' })
  async getUserVideos(@Param('userId') userId: number) {
    return this.videoService.getVideosByUser(userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a video' })
  @ApiResponse({ status: 200, description: 'Video deleted' })
  async deleteVideo(@Param('id') id: number) {
    return this.videoService.deleteVideo(id);
  }
}
