import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Reaction } from './reaction.entity';

@Entity()
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  text: string;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.stories, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @OneToMany(() => Reaction, (reaction) => reaction.story, { cascade: true })
  reactions: Reaction[];

  @CreateDateColumn()
  createdAt: Date;
}
