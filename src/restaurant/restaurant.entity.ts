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
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Restaurant {
  @ApiProperty({ 
    example: '33333333-3333-4333-8333-333333333333'  // أضفت مثال
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ 
    example: 'Sultani Pizza'  // أضفت مثال
  })
  @Column()
  name: string;

  @ApiProperty({ 
    example: '123 Main Street, New York', 
    required: false 
  })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({ 
    example: 'RESTAURANT-12345', 
    required: false 
  })
  @Column({ nullable: true })
  Identity: string;

  @ApiProperty({ 
    example: 'https://example.com/logo.png', 
    required: false 
  })
  @Column({ nullable: true })
  logo_url: string;

  @ApiProperty({ 
    description: 'Owner user',
    type: () => User 
  })
  @ManyToOne(() => User, (user) => user.restaurants, { onDelete: 'CASCADE' })
  owner: User;

  @ApiProperty({ 
    description: 'Category',
    type: () => Category 
  })
  @ManyToOne(() => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category | null;

  @ApiProperty({ 
    description: 'Meals',
    type: () => [Meal] 
  })
  @OneToMany(() => Meal, (meal) => meal.restaurant)
  meals: Meal[];

  @ApiProperty({ 
    description: 'Ratings',
    type: () => [Rating] 
  })
  @OneToMany(() => Rating, (rating) => rating.restaurant, { cascade: true })
  ratings: Rating[];

  @ApiProperty({ 
    example: 4.7 
  })
  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @ApiProperty({ 
    example: '2025-09-13T10:00:00.000Z' 
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ 
    example: '2025-09-13T10:00:00.000Z' 
  })
  @UpdateDateColumn()
  updatedAt: Date;
}