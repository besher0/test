import { IsNumber, IsNotEmpty, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // **استيراد Swagger**

export class AddToCartDto {
  @ApiProperty({
    example: '39c470f8-49c0-4653-9497-2f1a08b09b51',
    description: 'معرّف الوجبة (UUID)',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  mealId: string;

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
