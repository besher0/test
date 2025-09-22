import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({
    description: 'Restaurant name',
    example: 'Italiano Pizza',
  })
  @IsNotEmpty()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Restaurant location',
    required: false,
    example: '123 Main Street, New York',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Restaurant identity code',
    required: false,
    example: 'RESTAURANT-12345',
  })
  @IsOptional()
  @IsString()
  Identity?: string;

  @ApiPropertyOptional({ example: 'مطعم يقدم أشهى المأكولات الشعبية' })
  description?: string;

  @ApiPropertyOptional({ example: 'من الساعة 12 ظهراً إلى 9 مساءً' })
  workingHours?: string;

  @ApiProperty({
    description: 'Logo URL',
    required: false,
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiPropertyOptional({ example: 'https://example.com/main-image.png' })
  mainImage?: string;

  @ApiPropertyOptional({
    example: 33.123456,
    description: 'خط العرض للموقع الرئيسي',
  })
  latitude?: number;

  @ApiPropertyOptional({
    example: 36.123456,
    description: 'خط الطول للموقع الرئيسي',
  })
  longitude?: number;

  @ApiPropertyOptional({ example: '33333333-3333-4333-8333-333333333333' })
  countryId?: string;

  @ApiPropertyOptional({ example: '11111111-2222-3333-4444-555555555555' })
  categoryId?: string;
}
