/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Meal } from 'src/meal/meal.entity';
import { ApiProperty } from '@nestjs/swagger';


@Entity()
export class CartItem {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => Meal, { eager: true })
  meal: Meal;

  @ApiProperty({ required: true })
  @Column({ default: 1 })
  quantity: number;
}
