import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryLocationDto {
  @ApiProperty({ example: 'فرع دمشق - باب توما' })
  name: string;

  @ApiPropertyOptional({ example: 'موقع قريب من ساحة باب توما' })
  description?: string;

  @ApiProperty({ example: 33.513805 })
  latitude: number;

  @ApiProperty({ example: 36.292934 })
  longitude: number;
}
