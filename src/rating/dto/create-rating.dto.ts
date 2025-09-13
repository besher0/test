import { IsInt, Min, Max, IsUUID } from 'class-validator';

export class CreateRatingDto {
  @IsUUID()
  restaurantId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  value: number;
}
