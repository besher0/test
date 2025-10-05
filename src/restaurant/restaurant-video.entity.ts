import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_videos')
export class RestaurantVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  videoUrl: string;

  @Column()
  thumbnailUrl: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.videos, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @CreateDateColumn()
  createdAt: Date;
}
