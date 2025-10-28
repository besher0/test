import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class SendToUserDto {
  @ApiProperty({ description: 'User ID (UUID)' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description:
      'Optional structured data payload (will be persisted and sent as data.payload)',
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
