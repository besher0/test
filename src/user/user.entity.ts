/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Category } from '../category/category.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, ValidateIf } from 'class-validator';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Cart } from 'src/cart/cart.entity';
import { Order } from 'src/order/order.entity';
import { Rating } from 'src/rating/rating.entity';
import { Reaction } from 'src/reaction/reaction.entity';
import { Post } from 'src/post/post.entity';


@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @ApiProperty({ enum: ['meat', 'rice', 'drink', 'dessert', 'burger', 'pastry'], description: 'Favorite food', required: false })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf(o => o.userType === 'normalUser')
  @IsEnum(['meat', 'rice', 'drink', 'dessert', 'burger', 'pastry'], { message: 'Favorite food must be one of the listed options' })
  @Column({ nullable: true })
  favoriteFood: string;

  @Column({
    type: 'enum',
    enum: ['normalUser', 'admin', 'restaurant', 'store'],
    default: 'normalUser',
  })
  userType: string;

  @Column({
    type: 'enum',
    enum: ['male', 'female'],
  })
  gender: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profile_picture: string;

  @OneToMany(() => Category, category => category.user, { onDelete: 'CASCADE' })
  categories: Category[];

  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  restaurants: Restaurant[];

  @OneToOne(() => Cart, (cart) => cart.user, { cascade: true })
  @JoinColumn()
  cart: Cart;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
  
  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];

   @OneToMany(() => Post, (post) => post.owner)
  posts: Post[];

  // علاقة مع التفاعلات (المستخدم يتفاعل مع بوستات)
  @OneToMany(() => Reaction, (reaction) => reaction.user)
  reactions: Reaction[];
}