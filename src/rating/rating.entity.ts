/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { RatingReply } from './rating-reply.entity';

@Entity()
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.ratings, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.ratings, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  @Column({ type: 'int', width: 1 })
  score: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string|null;

  @OneToOne(() => RatingReply, (reply) => reply.rating)
  reply?: RatingReply;

  @CreateDateColumn()
  createdAt: Date;
}
