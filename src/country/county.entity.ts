/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Meal } from 'src/meal/meal.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Country {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  name: string;

  @ApiProperty({ required: false })
  @Column({  type: 'varchar',nullable: true })
  image_url?: string | null;

  @OneToMany(() => Meal, (meal) => meal.country)
  meals: Meal[];
}
