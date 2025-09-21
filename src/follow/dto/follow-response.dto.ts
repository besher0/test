import { ApiProperty } from '@nestjs/swagger';

export class ToggleFollowResponseDto {
  @ApiProperty({ example: true, description: 'هل يتابع المستخدم المطعم الآن؟' })
  isFollowing: boolean;

  @ApiProperty({ example: 'تمت متابعة المطعم بنجاح' })
  message: string;
}

export class FollowedRestaurantDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0' })
  id: string;

  @ApiProperty({ example: 'مطعم البيت الشامي' })
  name: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/restaurant.jpg',
  })
  imageUrl: string;
}

export class MyFollowedRestaurantsResponseDto {
  @ApiProperty({ type: [FollowedRestaurantDto] })
  restaurants: FollowedRestaurantDto[];
}
