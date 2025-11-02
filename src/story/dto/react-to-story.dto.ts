import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class ReactToStoryDto {
  @ApiProperty({ enum: ['like', 'love', 'fire'] })
  @IsNotEmpty()
  @IsIn(['like', 'love', 'fire'])
  type: 'like' | 'love' | 'fire';
}
