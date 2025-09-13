/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({ 
    description: 'Restaurant name',
    example: 'Italiano Pizza'
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Restaurant location',
    required: false,
    example: '123 Main Street, New York'  
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ 
    description: 'Restaurant identity code',
    required: false,
    example: 'RESTAURANT-12345' 
  })
  @IsOptional()
  @IsString()
  Identity?: string;

  @ApiProperty({ 
    description: 'Logo URL',
    required: false,
    example: 'https://example.com/logo.png' 
  })
  @IsOptional()
  @IsString()
  logo_url?: string;

  // @ApiProperty({ 
  //   // description: 'Category ID',
  //   required: false,
  //   // example: '22222222-2222-4222-8222-222222222222'  
  // })
  @IsOptional()
  categoryId?: string;

  // @ApiProperty({ 
  //   description: 'Owner ID',
  //   example: '11111111-1111-4111-8111-111111111111'  
  // })
  // @IsNotEmpty()
  // ownerId: string;
}