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
import { BusinessType } from 'src/common/business-type.enum';

// BusinessType moved to src/common/business-type.enum

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
    default: BusinessType.RESTAURANT,
  })
  type: BusinessType;

  @CreateDateColumn()
  createdAt: Date;
}
