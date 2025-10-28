import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsObject } from 'class-validator';

export class SendToManyDto {
  @ApiProperty({ description: 'Array of user IDs (UUIDs)', type: [String] })
  @IsArray()
  userIds: string[];

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Optional structured data payload to persist/send',
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
