import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class DeliveryLocation {
  @ApiProperty({ example: '33333333-3333-4333-8333-333333333333' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'فرع دمشق - باب توما' })
  @Column()
  name: string;

  @ApiProperty({ example: 'موقع قريب من ساحة باب توما', required: false })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ example: 33.513805 })
  @Column('decimal', { precision: 10, scale: 6 })
  latitude: number;

  @ApiProperty({ example: 36.292934 })
  @Column('decimal', { precision: 10, scale: 6 })
  longitude: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.deliveryLocations, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;
}
