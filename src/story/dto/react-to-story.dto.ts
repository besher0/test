import { ApiProperty } from '@nestjs/swagger';

export class ReactToStoryDto {
  @ApiProperty({ enum: ['like', 'love', 'fire'] })
  type: 'like' | 'love' | 'fire';
}
