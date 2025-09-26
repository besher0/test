import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { BusinessType } from 'src/restaurant/restaurant.entity';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Category description' })
  @IsString()
  description: string;

  @ApiProperty({ example: BusinessType.RESTAURANT, enum: BusinessType })
  @IsEnum(BusinessType)
  type: BusinessType;
}
