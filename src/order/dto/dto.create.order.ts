/* eslint-disable prettier/prettier */
import { IsUUID, IsInt, Min } from 'class-validator';

export class OrderItemDto {
  @IsUUID()
  mealId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
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
