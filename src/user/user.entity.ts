/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Category } from '../category/category.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, ValidateIf } from 'class-validator';
import { Restaurant } from 'src/restaurant/restaurant.entity';


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

}