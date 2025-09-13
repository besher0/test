/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { AddToCartDto } from './dto.createCart'; // تأكد من المسار الصحيح AddToCartDto
import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // **استيراد Swagger**

export class UpdateCartItemDto extends PartialType(AddToCartDto) {
  @ApiProperty({
      example: 3,
      description: 'الكمية المحدثة لعنصر السلة',
      type: Number,
      minimum: 0, // يمكن أن تكون 0 لحذف العنصر
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0) // يمكن أن تكون 0 لحذف العنصر
  quantity: number;
}
