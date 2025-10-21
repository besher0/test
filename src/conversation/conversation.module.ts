import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { Conversation } from './conversation.entity';
import { Participant } from './participant.entity';
import { Message } from './message.entity';
import { ConversationGateway } from './conversation.gateway';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Participant, Message]),
    JwtModule.register({}),
    NotificationModule,
  ],
  providers: [ConversationService, ConversationGateway, JwtService],
  controllers: [ConversationController],
  exports: [ConversationService],
})
export class ConversationModule {}
