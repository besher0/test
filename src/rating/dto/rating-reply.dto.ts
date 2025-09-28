import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
export enum BusinessType {
  RESTAURANT = 'restaurant',
  STORE = 'store',
}
export class CreateReplyDto {
  @IsEnum(BusinessType)
  type: BusinessType;

  @ApiProperty({ example: 'Thank you for your feedback!' })
  replyText: string;
}
