import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Video {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  publicId: string;

  @Column({ nullable: true })
  duration: number;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}
