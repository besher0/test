/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '../reaction.entity';

export class ReactResponseDto {
  @ApiProperty({ description: 'هل التفاعل تم (true) أم أُلغِي (false)' })
  reacted: boolean;

  @ApiProperty({
    enum: ReactionType,
    example: ReactionType.LIKE,
    description: 'نوع التفاعل الحالي إذا موجود',
    required: false,
  })  type?: string;
}
