import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingWithImageDto {
  @ApiProperty({ example: 5, description: 'Score of the rating (1-5)' })
  score: number;

  @ApiProperty({ example: 'Great food and service!', required: false })
  comment?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Optional image upload for the rating',
    required: false,
  })
  file?: any; // Swagger يتعرف أنه ملف
}
