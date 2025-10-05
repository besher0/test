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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { DeliveryLocation } from 'src/restaurant/delivery-location.entity';

@Entity()
export class Order {
  @ApiProperty({ example: 'order-uuid-123' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ type: () => Restaurant })
  @ManyToOne(() => Restaurant, { eager: true })
  restaurant: Restaurant;

  @ApiProperty({ type: [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ApiProperty({ example: 120.5 })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @ApiProperty({ example: 'DELIVERY', enum: ['PICKUP_POINT', 'DELIVERY'] })
  @Column({
    type: 'enum',
    enum: ['PICKUP_POINT', 'DELIVERY'],
    default: 'DELIVERY',
  })
  deliveryType: string;

  // إذا كان التسليم من نقطة استلام
  @ApiPropertyOptional({ type: () => DeliveryLocation })
  @ManyToOne(() => DeliveryLocation, { nullable: true, eager: true })
  @JoinColumn()
  deliveryLocation?: DeliveryLocation;

  // إذا كان ديلفري، نحتاج موقع المستخدم
  @ApiPropertyOptional({ example: 33.513805 })
  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  userLatitude?: number;

  @ApiPropertyOptional({ example: 36.292934 })
  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  userLongitude?: number;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELED'],
  })
  @Column({
    type: 'enum',
    enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELED'],
    default: 'PENDING',
  })
  status: string;

  // معلومات الدفع الإلكتروني
  @ApiProperty({
    example: 'UNPAID',
    enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
  })
  @Column({
    type: 'enum',
    enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'UNPAID',
  })
  paymentStatus: string;

  @ApiProperty({
    example: '5O190127TN364715T',
    required: false,
    description: 'PayPal order id',
  })
  @Column({ type: 'varchar', nullable: true })
  paypalOrderId?: string | null;

  @ApiProperty({
    example: '2GG279541U471931P',
    required: false,
    description: 'PayPal capture id',
  })
  @Column({ type: 'varchar', nullable: true })
  paypalCaptureId?: string | null;

  @ApiProperty({ example: '2025-09-22T12:39:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2025-09-22T12:39:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
  @ApiPropertyOptional({ example: 'يرجى الاتصال قبل التوصيل' })
  @Column({ type: 'varchar', nullable: true })
  notes?: string;

  @ApiPropertyOptional({ example: 'دمشق - باب توما' })
  @Column({ type: 'varchar', nullable: true })
  address?: string;
}
