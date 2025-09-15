/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany } from 'typeorm';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Reaction } from 'src/reaction/reaction.entity';

@Entity()
export class Reel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mediaUrl: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reels, {     onDelete: 'CASCADE', })
  restaurant: Restaurant;

  @OneToMany(() => Reaction, (reaction) => reaction.reel)
  reactions: Reaction[];

  @CreateDateColumn()
  createdAt: Date;
}
