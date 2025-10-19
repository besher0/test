import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Meal } from 'src/meal/meal.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Meal, { eager: true })
  meal: Meal;

  @ApiProperty({ example: 2 })
  @ApiProperty({ required: true })
  @Column()
  quantity: number;

  @ApiProperty({ example: 12.5 })
  @ApiProperty({ required: true })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ required: false, example: 'بدون فلفل' })
  @Column({ type: 'varchar', nullable: true })
  note?: string | null;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;
}
