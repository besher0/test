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
import { Post } from 'src/post/post.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  FIRE = 'fire',
}

@Entity('reactions')
@Unique(['user','post'])
export class Reaction {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

    @ApiProperty({ example: "like" })
  @ApiProperty({ required: true })
  @Column({
    type: 'enum',
    enum: ReactionType,
  })
  type: ReactionType;

  @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Post, (post) => post.reactions, { onDelete: 'CASCADE' })
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}
