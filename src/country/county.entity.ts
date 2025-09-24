import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Meal } from 'src/meal/meal.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Like } from 'src/like/like.entity';

@Entity()
export class Country {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  name: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true, name: 'image_url' }) // 👈 لازم تحدد type
  imageUrl?: string | null;

  @ApiProperty()
  @Column({ type: 'text', nullable: true, name: 'logo_image' }) // 👈 نفس الشي
  logoImage?: string | null;

  @OneToMany(() => Meal, (meal) => meal.country)
  meals: Meal[];

  @OneToMany(() => Restaurant, (restaurant) => restaurant.country)
  restaurants: Restaurant[];

  @OneToMany(() => Like, (like) => like.country)
  likes: Like[];
}
