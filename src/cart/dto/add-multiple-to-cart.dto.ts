/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddToCartDto } from './dto.createCart';

export class AddMultipleToCartDto {
  @ApiProperty({
    type: [AddToCartDto],
    description: 'Array of products to be added to the cart',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddToCartDto)
  items: AddToCartDto[];

    @ApiProperty({
    example: 2,
    description: 'الكمية المراد إضافتها من المنتج',
    type: Number,
    minimum: 1,
    required: false, // جعل الحقل غير إلزامي
  })
  @IsNumber()
  @IsOptional() // جعل الكمية اختيارية
  @Min(1)
  quantity: number;
}
