import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, description: 'New quantity for the cart item' })
  @IsInt()
  // allow zero and positive values; service will remove if zero
  @Min(0)
  quantity: number;
}
