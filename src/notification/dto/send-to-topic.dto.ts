import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendToTopicDto {
  @ApiProperty({ description: 'Topic name' })
  @IsString()
  topic: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  body: string;
}
