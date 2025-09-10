/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,  } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'image_url', nullable: true })
  image_url: string;

  @ManyToOne(() => User, user => user.categories)
  user: User;

}