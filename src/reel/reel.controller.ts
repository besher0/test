/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ReelService } from './reel.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';

@ApiTags('Reels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reels')
export class ReelController {
  constructor(private readonly reelService: ReelService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء ريل جديد (صورة/فيديو)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
    @ApiBody({
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
  create(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.reelService.create(user, file);
  }

  @Get()
  @ApiOperation({ summary: 'جلب كل الريلات النشطة (آخر 48 ساعة)' })
  findAll() {
    return this.reelService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب ريل واحد' })
  findOne(@Param('id') id: string) {
    return this.reelService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تعديل ريل' })
  update(@Param('id') id: string) {
    return this.reelService.update(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف ريل' })
  remove(@Param('id') id: string) {
    return this.reelService.remove(id);
  }
}
