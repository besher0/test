import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Rating } from './rating.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';

export enum BusinessType {
  RESTAURANT = 'restaurant',
  STORE = 'store',
}

@Entity()
export class RatingReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Rating, (rating) => rating.reply, { onDelete: 'CASCADE' })
  @JoinColumn()
  rating: Rating;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.replies, {
    onDelete: 'CASCADE',
    eager: true,
  })
  restaurant: Restaurant;

  @Column({ type: 'enum', enum: BusinessType, enumName: 'reply_business_type' })
  type: BusinessType;

  @Column({ type: 'text' })
  replyText: string;

  @CreateDateColumn()
  createdAt: Date;
}
