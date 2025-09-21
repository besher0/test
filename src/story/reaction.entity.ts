import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Story } from './story.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['like', 'love', 'fire'] })
  type: 'like' | 'love' | 'fire';

  @ManyToOne(() => Story, (story) => story.reactions, { onDelete: 'CASCADE' })
  story: Story;

  @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
