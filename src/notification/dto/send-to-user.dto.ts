import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

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
}
