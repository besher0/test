/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Category } from 'src/category/category.entity';
import { Meal } from 'src/meal/meal.entity';
import { Rating } from 'src/rating/rating.entity';

@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  Identity: string;

  @Column({ nullable: true })
  logo_url: string;

  @ManyToOne(() => User, (user) => user.restaurants, { onDelete: 'CASCADE' })
  owner: User;

  @ManyToOne(() => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category|null;

  @OneToMany(() => Meal, (meal) => meal.restaurant)
  meals: Meal[];

  @OneToMany(() => Rating, (rating) => rating.restaurant, { cascade: true })
  ratings: Rating[];

  @Column({ type: 'float', default: 0 })
  averageRating: number;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
