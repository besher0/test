import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { OrderItem } from './order-item.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { DeliveryLocation } from 'src/restaurant/delivery-location.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Restaurant, { eager: true })
  restaurant: Restaurant;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ApiProperty({ required: true })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: ['PICKUP_POINT', 'DELIVERY'],
    default: 'DELIVERY',
  })
  deliveryType: string;

  // إذا كان التسليم من نقطة استلام
  @ManyToOne(() => DeliveryLocation, { nullable: true, eager: true })
  @JoinColumn()
  deliveryLocation?: DeliveryLocation;

  // إذا كان ديلفري، نحتاج موقع المستخدم
  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  userLatitude?: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  userLongitude?: number;

  @ApiProperty({ required: true })
  @Column({
    type: 'enum',
    enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELED'],
    default: 'PENDING',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
