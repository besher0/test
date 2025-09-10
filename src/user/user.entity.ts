/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Category } from '../category/category.entity';
import { UserPreferences } from '../user-preferences/user-preferences.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, ValidateIf } from 'class-validator';


@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

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

  @ApiProperty({ example: '123456789', description: 'Identity number or code' })
  @Column( {nullable: false,})
  Identity: string;

  @ApiProperty({ example: 'France', description: 'Country of the user' })
  @Column({nullable: false,})
  country: string;

  @Column({ nullable: true })
  profile_picture: string;

  @Column({ nullable: true })
  bio: string;

  @OneToMany(() => UserPreferences, preference => preference.user, { onDelete: 'CASCADE' })
  preferences: UserPreferences[];

  @OneToMany(() => Category, category => category.user, { onDelete: 'CASCADE' })
  categories: Category[];

}