import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';

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

  @CreateDateColumn()
  createdAt: Date;
}
