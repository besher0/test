/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Category } from 'src/category/category.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Meal {
    @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true })
  @Column()
  name: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ required: true })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

    @ApiProperty({ required: false })
  @Column({ nullable: true })
  image_url: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.meals, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @ManyToOne(() => Category, (category) => category.meals, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Category;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
