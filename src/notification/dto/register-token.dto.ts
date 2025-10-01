import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegisterTokenDto {
  @ApiProperty({ description: 'User ID (UUID)' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'FCM token' })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Device type (android|ios|web)',
    required: false,
  })
  @IsString()
  deviceType?: string;
}
