import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'meal-uuid-123' })
  @IsUUID()
  mealId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty({ example: 'DELIVERY', enum: ['PICKUP_POINT', 'DELIVERY'] })
  @IsString()
  deliveryType: 'PICKUP_POINT' | 'DELIVERY';

  @ApiPropertyOptional({
    example: 'location-uuid-123',
    description: 'إذا كان PICKUP_POINT',
  })
  @IsOptional()
  @IsUUID()
  deliveryLocationId?: string;

  @ApiPropertyOptional({ example: 33.513805, description: 'إذا كان DELIVERY' })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 36.292934, description: 'إذا كان DELIVERY' })
  @IsOptional()
  longitude?: number;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
