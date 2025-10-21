import { IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  recipientId?: string; // use when conversationId not provided

  @IsString()
  content: string;

  @IsOptional()
  attachments?: any;

  @IsOptional()
  @IsString()
  clientMessageId?: string; // optional client-side id to support idempotency
}
