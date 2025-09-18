import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { PostReaction } from './post-reaction.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  text?: string;

  @Column({ nullable: true })
  mediaUrl?: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.posts, {
    eager: true,
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @OneToMany(() => PostReaction, (reaction) => reaction.post, {
    cascade: true,
    eager: false,
  })
  reactions: PostReaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
