import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Participant } from './participant.entity';
import { Message } from './message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { NotificationService } from 'src/notification/notification.service';
import { User } from 'src/user/user.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly notificationService: NotificationService,
  ) {}

  async createConversation(dto: CreateConversationDto, creator: User) {
    // create conversation and participants
    const conv = this.conversationRepo.create({
      type: dto.type,
      title: dto.title,
    });
    const parts: Participant[] = [];
    for (const pid of dto.participantIds) {
      const part = this.participantRepo.create({
        user: { id: pid } as unknown as User,
        role: 'user',
      });
      parts.push(part);
    }
    // ensure creator is participant
    const creatorPart = this.participantRepo.create({
      user: creator,
      role: 'user',
    });
    parts.push(creatorPart);
    conv.participants = parts;

    return this.conversationRepo.save(conv);
  }

  async findOrCreateConversationBetween(
    user: { id: string } | Partial<User>,
    recipientId: string,
  ) {
    // search for existing conversation with exactly these two participants
    // Use a query on participants that groups by conversationId only (Postgres requires grouped SELECT columns)
    const ids = [String((user as Partial<User>).id), String(recipientId)];

    const subQ = this.participantRepo
      .createQueryBuilder('p')
      .select('p.conversationId', 'conversationId')
      .innerJoin('p.user', 'u')
      .where('u.id IN (:...ids)', { ids })
      .groupBy('p.conversationId')
      .having('COUNT(DISTINCT u.id) = :count', { count: 2 });

    type RawRow = { conversationId?: string; p_conversationId?: string };
    const rawRows = await subQ.getRawMany();
    if (rawRows.length > 0) {
      const first = rawRows[0] as RawRow;
      const convIdRaw = first.conversationId ?? first.p_conversationId;
      const convId = convIdRaw ?? null;
      if (convId) {
        return this.conversationRepo.findOne({
          where: { id: convId },
          relations: ['participants', 'messages'],
        });
      }
    }

    // create new
    const conv = this.conversationRepo.create({});
    const p1 = this.participantRepo.create({
      user: user as User,
      role: 'user',
    });
    const p2 = this.participantRepo.create({
      user: { id: recipientId } as unknown as User,
      role: 'user',
    });
    conv.participants = [p1, p2];
    return this.conversationRepo.save(conv);
  }

  // sender can be a partial user object (usually just { id }) from gateway
  async sendMessage(
    sender: { id: string } | Partial<User>,
    conversationId: string | undefined,
    dto: SendMessageDto,
  ): Promise<{ conversation: Conversation | null; message: Message | null }> {
    let conv: Conversation | null = null;
    if (conversationId) {
      conv = await this.conversationRepo.findOne({
        where: { id: conversationId },
        relations: ['participants'],
      });
      if (!conv) throw new NotFoundException('Conversation not found');
    } else {
      if (!dto.recipientId)
        throw new BadRequestException(
          'recipientId is required when conversationId is not provided',
        );
      conv = await this.findOrCreateConversationBetween(
        sender,
        dto.recipientId,
      );
    }

    // normalize sender id
    const senderId = (sender as Partial<User>).id;

    // idempotency check: if clientMessageId is present and a message exists, return it
    if (dto.clientMessageId) {
      const existing = await this.messageRepo.findOne({
        where: { clientMessageId: dto.clientMessageId },
        relations: ['sender'],
      });
      if (
        existing &&
        String((existing.sender as unknown as User)?.id) === String(senderId)
      ) {
        return { conversation: conv, message: existing };
      }
    }

    const message = this.messageRepo.create({
      conversation: conv as unknown as Conversation,
      sender: { id: String(senderId) } as unknown as User,
      content: dto.content,
      attachments: (dto.attachments as unknown) || null,
      status: 'SENT',
      clientMessageId: dto.clientMessageId || null,
    });
    const saved = await this.messageRepo.save(message);

    // update conversation lastMessageAt
    if (conv) {
      conv.lastMessageAt = saved.createdAt;

      await this.conversationRepo.save(conv);
    }

    // send push notifications to other participants
    try {
      const participantUserIds = ((conv && conv.participants) || [])
        .map((p) => String(p.user?.id))
        .filter((id) => id && id !== String(senderId));
      if (participantUserIds.length) {
        await this.notificationService.sendToManyUsers(
          participantUserIds,
          'New message',
          dto.content?.slice(0, 200) ?? 'You have a new message',
        );
      }
    } catch (err) {
      // don't fail the request if notification sending fails
      // log the error for visibility
      console.warn('notification send failed', err);
    }

    return { conversation: conv, message: saved };
  }

  async getUserConversations(userId: string, page = 1, perPage = 20) {
    const take = perPage;
    const skip = (page - 1) * take;
    // Load conversations that include the given user and include participant user info
    const qb = this.conversationRepo
      .createQueryBuilder('c')
      // filter conversations where the current user is a participant using a subquery
      .where(
        'c.id IN (SELECT p.conversationId FROM participant p WHERE p.userId = :userId)',
        { userId },
      )
      .leftJoinAndSelect('c.participants', 'p')
      .leftJoinAndSelect('p.user', 'u')
      // also load restaurants for participant users so we can pick the logo for business users
      .leftJoinAndSelect('u.restaurants', 'ur')
      .orderBy('c.lastMessageAt', 'DESC')
      .take(take)
      .skip(skip);

    const [items] = await qb.getManyAndCount();

    // Map conversations to include participants' user info (lightweight)
    const mapped = items.map((c) => ({
      id: c.id,
      title: c.title ?? null,
      lastMessageAt: c.lastMessageAt ?? null,
      // exclude the requesting user from the participants list
      participants: (c.participants || [])
        .filter(
          (p) => String((p.user as User | undefined)?.id) !== String(userId),
        )
        .map((p) => {
          // Type the participant user explicitly to avoid `any` and unsafe member access
          const u = p.user as User | undefined;
          // prefer profile picture by default
          let picture = u?.profile_picture ?? null;
          // if this user is a restaurant/store owner, prefer their restaurant logo if present
          if (u && (u.userType === 'restaurant' || u.userType === 'store')) {
            const rest = u.restaurants?.[0] ?? null;
            if (rest && rest.logo_url) {
              picture = rest.logo_url;
            }
          }
          return {
            id: u?.id ?? null,
            firstName: u?.firstName ?? null,
            lastName: u?.lastName ?? null,
            email: u?.email ?? null,
            profile_picture: picture,
            role: p.role ?? null,
          } as const;
        }),
    }));

    // Deduplicate conversations by the set of other participant ids so the same
    // other user(s) don't appear multiple times (keep the most-recent conv)
    const dedupeMap = new Map<string, (typeof mapped)[0]>();
    for (const conv of mapped) {
      const others = conv.participants || [];
      const otherIds = others
        .map((o) => String(o.id))
        .filter(Boolean)
        .sort();
      const key =
        otherIds.length > 0 ? `g:${otherIds.join(',')}` : `c:${conv.id}`;
      const existing = dedupeMap.get(key);
      const convTime = conv.lastMessageAt
        ? new Date(conv.lastMessageAt).getTime()
        : 0;
      const existingTime = existing?.lastMessageAt
        ? new Date(existing.lastMessageAt).getTime()
        : 0;
      if (!existing || convTime > existingTime) {
        dedupeMap.set(key, conv);
      }
    }

    const deduped = Array.from(dedupeMap.values());
    const totalDeduped = deduped.length;

    return {
      page,
      perPage: take,
      total: totalDeduped,
      totalPages: Math.ceil(totalDeduped / take),
      isLastPage:
        totalDeduped === 0 ? true : page >= Math.ceil(totalDeduped / take),
      conversations: deduped,
    };
  }

  async getMessages(conversationId: string, page = 1, perPage = 20) {
    const take = perPage;
    const skip = (page - 1) * take;
    const [msgs, total] = await this.messageRepo.findAndCount({
      where: {
        conversation: { id: conversationId } as unknown as Conversation,
      },
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return {
      page,
      perPage: take,
      total,
      totalPages: Math.ceil(total / take),
      isLastPage: total === 0 ? true : page >= Math.ceil(total / take),
      messages: msgs,
    };
  }

  /**
   * Check whether a given userId is a participant of a conversation
   * Used by the WebSocket gateway to authorize joins
   */
  async isUserParticipant(conversationId: string, userId: string) {
    const count = await this.participantRepo
      .createQueryBuilder('p')
      .innerJoin('p.user', 'u')
      .where('p.conversationId = :conversationId', { conversationId })
      .andWhere('u.id = :userId', { userId })
      .getCount();
    return count > 0;
  }
}
