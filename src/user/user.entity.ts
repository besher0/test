import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Category } from '../category/category.entity';
import { ApiProperty } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Cart } from 'src/cart/cart.entity';
import { Order } from 'src/order/order.entity';
import { Rating } from 'src/rating/rating.entity';
import { Reaction } from 'src/story/reaction.entity';
// import { Post } from 'src/post/post.entity';
import { Follow } from 'src/follow/follow.entity';
import { Like } from 'src/like/like.entity';

@Entity('user')
export class User {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'John' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column()
  lastName: string;

  @ApiProperty({ example: '2025-09-13T10:00:00.000Z' })
  @Column({ type: 'date' })
  birthDate: Date;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => o.userType === 'normalUser')
  @ManyToOne(() => Category, (category) => category.user, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'favoriteFood' })
  favoriteFood: Category;

  @ApiProperty({ example: 'normalUser' })
  @Column({
    type: 'enum',
    enum: ['normalUser', 'admin', 'restaurant', 'store'],
    default: 'normalUser',
  })
  userType: string;

  @ApiProperty({ example: 'male' })
  @Column({
    type: 'enum',
    enum: ['male', 'female'],
  })
  gender: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column()
  password: string;

  @ApiProperty()
  @Column({ nullable: true })
  profile_picture: string;

  // @ApiProperty()
  // @OneToMany(() => Category, category => category.user, { eager: true, nullable: true })
  // categories: Category[];

  @ApiProperty()
  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  restaurants: Restaurant[];

  @OneToOne(() => Cart, (cart) => cart.user, { cascade: true })
  @JoinColumn()
  cart: Cart;

  @ApiProperty()
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @ApiProperty()
  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];

  // @ApiProperty()
  //  @OneToMany(() => Post, (post) => post.owner)
  // posts: Post[];

  // علاقة مع التفاعلات (المستخدم يتفاعل مع بوستات)
  @ApiProperty()
  @OneToMany(() => Reaction, (reaction) => reaction.user)
  reactions: Reaction[];

  @OneToMany(() => Follow, (follow) => follow.user)
  follows: Follow[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];
}
