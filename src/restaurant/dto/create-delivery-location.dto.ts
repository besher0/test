import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeliveryLocationDto {
  @ApiProperty({ example: 'فرع دمشق - باب توما' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'موقع قريب من ساحة باب توما' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 33.513805 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 36.292934 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;
}
