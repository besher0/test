import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConversationService } from './conversation.service';
import { Logger } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@WebSocketGateway({ namespace: '/conversations' })
export class ConversationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConversationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly convService: ConversationService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      const auth = client.handshake.auth as { token?: string } | undefined;
      const query = client.handshake.query as { token?: string } | undefined;
      const token = auth?.token ?? query?.token;
      if (!token) {
        this.logger.warn('No token provided in handshake');
        client.disconnect(true);
        return;
      }
      const payload = this.jwtService.verify<JwtPayload>(
        String(token).replace(/^Bearer\s+/i, ''),
      );
      client.user = payload;
      this.logger.debug(`Socket connected: ${client.id} user:${payload.sub}`);
    } catch (err) {
      this.logger.warn('WebSocket authentication failed: ' + String(err));
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: AuthenticatedSocket, payload: { conversationId: string }) {
    client.join(payload.conversationId);
    this.server.to(payload.conversationId).emit('participant_joined', {
      conversationId: payload.conversationId,
      participantId: client.user?.sub,
      joinedAt: new Date(),
    });
  }

  @SubscribeMessage('leave')
  handleLeave(
    client: AuthenticatedSocket,
    payload: { conversationId: string },
  ) {
    client.leave(payload.conversationId);
    this.server.to(payload.conversationId).emit('participant_left', {
      conversationId: payload.conversationId,
      participantId: client.user?.sub,
      leftAt: new Date(),
    });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    client: AuthenticatedSocket,
    payload: {
      conversationId?: string;
      recipientId?: string;
      content: string;
      attachments?: unknown;
    },
  ) {
    try {
      const user = client.user;
      if (!user) return;
      const sender = { id: user.sub };
      const result = await this.convService.sendMessage(
        sender,
        payload.conversationId,
        {
          recipientId: payload.recipientId,
          content: payload.content,
          attachments: payload.attachments,
        },
      );
      const typedResult = result as {
        conversationId?: string;
        conversation?: { id?: string } | null;
        message?: { conversation?: { id?: string } } | null;
      };

      const convId =
        typedResult.conversation?.id ??
        typedResult.message?.conversation?.id ??
        typedResult.conversationId;

      const message = typedResult.message ?? null;
      if (convId) {
        this.server
          .to(convId)
          .emit('new_message', { conversationId: convId, message });
      }
    } catch (err) {
      this.logger.error('send_message failed: ' + String(err));
    }
  }
}
