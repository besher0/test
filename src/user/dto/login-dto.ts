import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com', // أضفت مثال
  })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'StrongPass123!', // أضفت مثال
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'Optional FCM token for push notifications',
    required: false,
  })
  @IsString()
  // token is optional when provided by the client
  fcmToken?: string;

  @ApiProperty({
    description: 'Optional device type (android|ios|web)',
    required: false,
  })
  @IsString()
  deviceType?: string;
}
