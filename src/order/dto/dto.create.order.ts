import {
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'meal-uuid-123' })
  @IsUUID()
  mealId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: 'بدون زيتون',
    description: 'ملاحظة لهذا العنصر فقط',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
import { IsArray, ValidateNested } from 'class-validator';
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

  @ApiPropertyOptional({ type: [OrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: '2025-10-20T18:30:00.000Z',
    description: 'موعد التوصيل/الاستلام المجدول ISO8601',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'تنظيف السلة بعد إنشاء الطلب؟',
  })
  @IsOptional()
  clearCart?: boolean;
}
