import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReactionType } from '../reaction.entity';

export class ReactDto {
  @ApiProperty({
    enum: ReactionType,
    example: ReactionType.LIKE,
    description: 'نوع التفاعل: LIKE أو LOVE أو FIRE',
  })
  @IsEnum(ReactionType)
  type: ReactionType;
}
