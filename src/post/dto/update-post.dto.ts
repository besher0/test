/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {
  @ApiProperty({ example: 'عرض جديد على البرغر 🍔', description: 'محتوى البوست', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'https://example.com/new-image.jpg', description: 'رابط صورة/فيديو', required: false })
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
