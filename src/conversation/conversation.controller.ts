import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly convService: ConversationService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateConversationDto, @CurrentUser() user: User) {
    return this.convService.createConversation(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  getMyConversations(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const perPage = limit ? Math.max(1, Number(limit)) : 20;
    return this.convService.getUserConversations(user.id, pageNum, perPage);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/messages')
  async sendToConversation(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ) {
    return this.convService.sendMessage(user, id, dto);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('messages')
  async sendMessageAutoCreate(
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ) {
    return this.convService.sendMessage(user, undefined, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const perPage = limit ? Math.max(1, Number(limit)) : 20;
    return this.convService.getMessages(id, pageNum, perPage);
  }
}
