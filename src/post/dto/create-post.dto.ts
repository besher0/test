import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BusinessType } from '../post.entity';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;
}
