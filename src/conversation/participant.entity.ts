import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, (c) => c.participants, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ type: 'varchar', default: 'user' })
  role: string;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt?: Date | null;
}
