import { ApiProperty } from '@nestjs/swagger';

export class RestaurantProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  profileImage: string;

  @ApiProperty()
  followersCount: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  isFollowed: boolean; // هل المستخدم الحالي متابع المطعم
}
