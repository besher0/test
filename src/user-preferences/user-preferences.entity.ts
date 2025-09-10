/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
// import { FoodCategory } from 'src/food-category/food-category.entity';

@Entity()
export class UserPreferences {
  @PrimaryGeneratedColumn()
  preference_id: number;

  @ManyToOne(() => User, user => user.preferences)
  user: User;

  @Column()
  preference_type: string;

  @Column()
  preference_value: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
  
//   @ManyToOne(() => FoodCategory, category => category.preferences)
// foodCategory: FoodCategory;
}