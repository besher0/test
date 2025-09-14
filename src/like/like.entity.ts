/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Meal } from 'src/meal/meal.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
@Unique(['user', 'meal'])
@Unique(['user', 'restaurant'])
export class Like {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.likes, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Meal, (meal) => meal.likes, { nullable: true, eager: true, onDelete: 'CASCADE' })
  meal: Meal ;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.likes, { nullable: true, eager: true, onDelete: 'CASCADE' })
  restaurant: Restaurant ;

  @ApiProperty({ example: '2025-09-14T12:34:56Z' })
  @CreateDateColumn()
  createdAt: Date;
}
