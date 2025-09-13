/* eslint-disable prettier/prettier */
import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // **استيراد Swagger**

export class AddToCartDto {
  @ApiProperty({
      example: 1,
      description: 'معرف المنتج المراد إضافته إلى السلة',
      type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({
      example: 2,
      description: 'الكمية المراد إضافتها من المنتج',
      type: Number,
      minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;
}