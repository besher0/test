import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
} from 'class-validator';
export enum BusinessType {
  RESTAURANT = 'restaurant',
  STORE = 'store',
}
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
  // Identity fields are now handled as uploaded images (identityImage1 / identityImage2)
  @ApiPropertyOptional({
    example: null,
    description: 'URL to identity image 1 (front)',
    required: false,
  })
  @IsOptional()
  @IsString()
  identityImage1?: string | null;

  @ApiPropertyOptional({
    example: null,
    description: 'URL to identity image 2 (back)',
    required: false,
  })
  @IsOptional()
  @IsString()
  identityImage2?: string | null;

  @ApiPropertyOptional({ example: 'مطعم يقدم أشهى المأكولات الشعبية' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'من الساعة 12 ظهراً إلى 9 مساءً' })
  @IsOptional()
  @IsString()
  workingHours?: string;

  // Accept logo as a string field (logo) to match incoming requests; images can still be sent as multipart files.
  @ApiPropertyOptional({
    description: 'Logo URL',
    required: false,
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsEnum(BusinessType)
  type?: BusinessType = BusinessType.RESTAURANT;

  @ApiPropertyOptional({ example: 'https://example.com/main-image.png' })
  @IsOptional()
  @IsString()
  mainImage?: string;

  @ApiPropertyOptional({
    example: 33.123456,
    description: 'خط العرض للموقع الرئيسي',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 36.123456,
    description: 'خط الطول للموقع الرئيسي',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: '33333333-3333-4333-8333-333333333333' })
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiPropertyOptional({ example: '11111111-2222-3333-4444-555555555555' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'REF-ABCD1234',
    description:
      'If you have a referral code from another restaurant/store, provide it here',
  })
  @IsOptional()
  @IsString()
  referralCodeUsed?: string;
}
