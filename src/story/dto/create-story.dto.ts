import { ApiProperty } from '@nestjs/swagger';

export class CreateStoryDto {
  @ApiProperty({ required: false })
  text?: string;
}
