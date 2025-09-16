/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Rating } from './rating.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';

@Entity()
export class RatingReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Rating, (rating) => rating.reply, { onDelete: 'CASCADE' })
  @JoinColumn()
  rating: Rating;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.replies, { onDelete: 'CASCADE', eager: true })
  restaurant: Restaurant;

  @Column({ type: 'text' })
  replyText: string;

  @CreateDateColumn()
  createdAt: Date;
}
