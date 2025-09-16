/* eslint-disable prettier/prettier */
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Restaurant } from "./restaurant.entity";

@Entity('restaurant_images')
export class RestaurantImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.images, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;
}
