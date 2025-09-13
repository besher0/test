import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ReactionType } from '../reaction.entity';

export class CreateReactionDto {
  @IsUUID()
  postId: string;

  @IsNotEmpty()
  @IsEnum(ReactionType)
  type: ReactionType;
}
