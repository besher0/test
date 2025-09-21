import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ReactToPostDto {
  @ApiProperty({ enum: ['like', 'love', 'fire'] })
  @IsIn(['like', 'love', 'fire'])
  type: 'like' | 'love' | 'fire';
}
