import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

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
}
