import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Column,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';

export enum BusinessType {
  RESTAURANT = 'restaurant',
  STORE = 'store',
}

@Entity()
@Unique(['user', 'restaurant'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.follows, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.follows, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @Column({
    type: 'enum',
    enum: BusinessType,
    enumName: 'business_type_enum',
    nullable: true,
  })
  type: BusinessType;

  @CreateDateColumn()
  createdAt: Date;
}
