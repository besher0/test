/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Post } from './post.entity';

export type ReactionTypes = 'like' | 'love' | 'fire';

@Entity('post_reactions')
@Unique(['user', 'post'])
export class PostReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['like', 'love', 'fire'] })
  type: ReactionTypes;

  @ManyToOne(() => Post, (post) => post.reactions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  post: Post;

  @ManyToOne(() => User, (user) => user.reactions, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: true,
  })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
