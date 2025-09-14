/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class ToggleLikeResponseDto {
  @ApiProperty({ example: true, description: 'هل أعجب المستخدم بهذا العنصر الآن؟' })
  isLiked: boolean;

  @ApiProperty({ example: 'تم تسجيل الإعجاب بنجاح' })
  message: string;
}

export class MyLikesResponseDto {
  @ApiProperty({
    example: [
      { id: 'meal-id-123', type: 'meal', name: 'كبسة سعودية' },
      { id: 'rest-id-456', type: 'restaurant', name: 'مطعم البيت الشامي' },
    ],
  })
  likes: Array<{ id: string; type: 'meal' | 'restaurant'; name: string }>;
}
