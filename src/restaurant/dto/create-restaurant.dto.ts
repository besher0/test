/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRestaurantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  Identity?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  categoryId?: string;

  @IsNotEmpty()
  ownerId: string;
}
