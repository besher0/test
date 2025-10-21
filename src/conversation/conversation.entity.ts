import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Participant } from './participant.entity';
import { Message } from './message.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  type?: string;

  @Column({ type: 'varchar', nullable: true })
  title?: string;

  @OneToMany(() => Participant, (p) => p.conversation, { cascade: true })
  participants: Participant[];

  @OneToMany(() => Message, (m) => m.conversation, { cascade: true })
  messages: Message[];

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
