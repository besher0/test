import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'This is my new post 🎉',
    description: 'محتوى البوست (نص)',
    type: 'string',
  })
  content: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'صورة أو فيديو للمنشور',
  })
  @IsOptional()
  mediaUrl?: string;
}
