/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany,  } from 'typeorm';
import { User } from '../user/user.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Meal } from 'src/meal/meal.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: "Italiano Pizza" })
  @Column()
  name: string;

  @ApiProperty({ example: "ingredients Italiano pizza" })
  @Column()
  description: string;

  @ApiProperty({ example: "https://example.com/image.jpg" })
  @Column({ name: 'image_url', nullable: true })
  image_url: string;

  @OneToMany(() => User, user => user.favoriteFood)
  user: User;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.category)
restaurants: Restaurant[];

@OneToMany(() => Meal, (meal) => meal.category)
meals: Meal[];

}