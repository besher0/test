import { ApiProperty } from '@nestjs/swagger';

export class ToggleLikeResponseDto {
  @ApiProperty({
    example: true,
    description: 'هل أعجب المستخدم بهذا العنصر الآن؟',
  })
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

// export class MealLikeDto {
//   id: number;
//   name: string;
// }

// export class RestaurantLikeDto {
//   id: number;
//   name: string;
// }

// export class CountryLikeDto {
//   @ApiProperty({
//     description: 'معرّف الدولة',
//     example: '123e4567-e89b-12d3-a456-426614174000',
//   })
//   id: string;

//   @ApiProperty({ description: 'اسم الدولة', example: 'سوريا' })
//   name: string;

//   @ApiProperty({
//     description: 'صورة الدولة',
//     example: 'https://res.cloudinary.com/.../countries/flag.png',
//   })
//   imageUrl: string;
// }

export class MealLikeDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'كبسة سعودية' })
  name: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../meals/kabsa.png' })
  image?: string;

  @ApiProperty({
    example: true,
    description: 'هل المستخدم عامل إعجاب بهذا العنصر',
  })
  isLiked: boolean;
}

export class RestaurantLikeDto {
  @ApiProperty({ example: 'rest-id-456' })
  id: string;

  @ApiProperty({ example: 'مطعم البيت الشامي' })
  name: string;

  @ApiProperty({
    example: true,
    description: 'هل المستخدم عامل إعجاب بهذا العنصر',
  })
  isLiked: boolean;
}

export class CountryLikeDto {
  @ApiProperty({
    description: 'معرّف الدولة',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ description: 'اسم الدولة', example: 'سوريا' })
  name: string;

  @ApiProperty({
    description: 'صورة الدولة',
    example: 'https://res.cloudinary.com/.../countries/flag.png',
  })
  imageUrl: string;

  @ApiProperty({
    example: true,
    description: 'هل المستخدم عامل إعجاب بهذا العنصر',
  })
  isLiked: boolean;
}

export class MealLikesResponseDto {
  @ApiProperty({ type: [MealLikeDto] })
  meals: MealLikeDto[];
}

export class RestaurantLikesResponseDto {
  @ApiProperty({ type: [RestaurantLikeDto] })
  restaurants: RestaurantLikeDto[];
}

export class CountryLikesResponseDto {
  @ApiProperty({ type: [CountryLikeDto] })
  countries: CountryLikeDto[];
}
