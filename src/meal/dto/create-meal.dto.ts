/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';

export class CreateMealDto {
  @ApiProperty({ example: 'كبسة لحم' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'أكلة شعبية سعودية' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 45.5 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ example: '30 دقيقة' })
  @IsOptional()
  @IsString()
  preparationTime?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty({ example: 'uuid-restaurant-id' })
  @IsNotEmpty()
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ example: 'uuid-category-id', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  // ✅ countryId للإرتباط مع البلد
  @ApiProperty({ example: 'uuid-country-id', required: false })
  @IsOptional()
  @IsUUID()
  countryId?: string;
}
