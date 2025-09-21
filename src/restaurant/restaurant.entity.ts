import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Category } from 'src/category/category.entity';
import { Meal } from 'src/meal/meal.entity';
import { Rating } from 'src/rating/rating.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Follow } from 'src/follow/follow.entity';
import { Like } from 'src/like/like.entity';
import { Post } from 'src/post/post.entity';
import { Story } from 'src/story/story.entity';
import { RatingReply } from 'src/rating/rating-reply.entity';
import { Country } from 'src/country/county.entity';
import { RestaurantImage } from './restaurant-image.entity';
import { RestaurantVideo } from './restaurant-video.entity';

@Entity()
export class Restaurant {
  @ApiProperty({
    example: '33333333-3333-4333-8333-333333333333', // أضفت مثال
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Sultani Pizza', // أضفت مثال
  })
  @Column()
  name: string;

  @ApiProperty({
    example: '123 Main Street, New York',
    required: false,
  })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({
    example: 'RESTAURANT-12345',
    required: false,
  })
  @Column({ nullable: true })
  Identity: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    required: false,
  })
  @Column({ nullable: true })
  logo_url: string;

  @ApiProperty({
    example: 'https://example.com/main-image.png',
    required: false,
  })
  @Column({ type: 'varchar', nullable: true })
  mainImage: string | null;

  @ApiProperty({ example: 'مطعم يقدم أشهى المأكولات الشعبية' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'من الساعة 12 ظهراً إلى 9 مساءً' })
  @Column({ type: 'varchar', nullable: true })
  workingHours: string | null;

  @ApiProperty({ description: 'Country', type: () => Country })
  @ManyToOne(() => Country, (country) => country.restaurants, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'countryId' })
  country: Country | null;

  @ApiProperty({
    description: 'Owner user',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.restaurants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @ApiProperty({
    description: 'Category',
    type: () => Category,
  })
  @ManyToOne(() => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category | null;

  @ApiProperty({
    description: 'Meals',
    type: () => [Meal],
  })
  @OneToMany(() => Meal, (meal) => meal.restaurant)
  meals: Meal[];

  @ApiProperty({
    description: 'Ratings',
    type: () => [Rating],
  })
  @OneToMany(() => Rating, (rating) => rating.restaurant, { cascade: true })
  ratings: Rating[];

  @OneToMany(() => RatingReply, (reply) => reply.restaurant)
  replies: RatingReply[];

  @ApiProperty({
    example: 4.7,
  })
  @Column({ type: 'float', default: 0, nullable: true })
  averageRating: number;

  @OneToMany(() => Follow, (follow) => follow.restaurant)
  follows: Follow[];

  @OneToMany(() => Like, (like) => like.restaurant)
  likes: Like[];

  @OneToMany(() => Post, (post) => post.restaurant)
  posts: Post[];

  @OneToMany(() => Story, (story) => story.restaurant)
  stories: Story[];

  @OneToMany(() => RestaurantImage, (image) => image.restaurant, {
    cascade: true,
  })
  images: RestaurantImage[];

  @OneToMany(() => RestaurantVideo, (video) => video.restaurant, {
    cascade: true,
  })
  videos: RestaurantVideo[];

  @ApiProperty({
    example: '2025-09-13T10:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2025-09-13T10:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
