/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,  } from 'typeorm';
import { User } from '../user/user.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Meal } from 'src/meal/meal.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'image_url', nullable: true })
  image_url: string;

  @ManyToOne(() => User, user => user.categories)
  user: User;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.category)
restaurants: Restaurant[];

@OneToMany(() => Meal, (meal) => meal.category)
meals: Meal[];

}