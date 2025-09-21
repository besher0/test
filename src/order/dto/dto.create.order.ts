import { IsUUID, IsInt, Min } from 'class-validator';

export class OrderItemDto {
  @IsUUID()
  mealId: string;

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
  @IsString()
  deliveryType: 'PICKUP_POINT' | 'DELIVERY';

  // إذا كان PICKUP_POINT
  @IsOptional()
  @IsUUID()
  deliveryLocationId?: string;

  // إذا كان DELIVERY
  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;
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
