/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStoryDto {
  @ApiProperty({ required: false })
  text?: string;
}
