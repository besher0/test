import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Reaction } from 'src/reaction/reaction.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posts')
export class Post {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Classic cheese pizza' })
  @ApiProperty({ required: true })
  @Column()
  content: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  imageUrl?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  videoUrl?: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  owner: User;

  @OneToMany(() => Reaction, (reaction) => reaction.post, { cascade: true })
  reactions: Reaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
