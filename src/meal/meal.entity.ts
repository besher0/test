import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Category } from 'src/category/category.entity';
import { Country } from 'src/country/county.entity'; // 👈 أضفنا الاستيراد
import { ApiProperty } from '@nestjs/swagger';
import { Like } from 'src/like/like.entity';

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

  @Column({ type: 'float', default: 0, nullable: true })
  price: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  image_url: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  preparationTime: string; // ⏱️ وقت التحضير

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.meals, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @ManyToOne(() => Category, (category) => category.meals, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Category;

  @ManyToOne(() => Country, (country) => country.meals, {
    nullable: true,
    onDelete: 'SET NULL',
  }) // 👈 ربط البلد
  country?: Country;

  @OneToMany(() => Like, (like) => like.meal)
  likes: Like[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
