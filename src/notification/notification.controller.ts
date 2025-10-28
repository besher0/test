// src/notification/notification.controller.ts
import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { NotificationService } from './notification.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendToUserDto } from './dto/send-to-user.dto';
import { SendToManyDto } from './dto/send-to-many.dto';
import { SendToTopicDto } from './dto/send-to-topic.dto';
// read/unread DTOs removed

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // المستخدم يرسل التوكن للسيرفر
  @Post('register-token')
  @ApiOperation({ summary: 'Register or update an FCM token for a user' })
  @ApiBody({ type: RegisterTokenDto })
  @ApiResponse({ status: 201, description: 'Token saved/updated' })
  async registerToken(@Body() dto: RegisterTokenDto) {
    return this.notificationService.saveToken(
      dto.userId,
      dto.token,
      dto.deviceType || 'unknown',
    );
  }

  // إرسال إشعار لمستخدم واحد
  @Post('send-to-user')
  @ApiOperation({
    summary: 'Send a notification to a single user (all devices)',
  })
  @ApiBody({ type: SendToUserDto })
  async sendToUser(@Body() dto: SendToUserDto) {
    return this.notificationService.sendToUser(
      dto.userId,
      dto.title,
      dto.body,
      dto.data,
    );
  }

  // إرسال إشعار لمجموعة مستخدمين
  @Post('send-to-many')
  @ApiOperation({ summary: 'Send a notification to many users' })
  @ApiBody({ type: SendToManyDto })
  async sendToMany(@Body() dto: SendToManyDto) {
    return this.notificationService.sendToManyUsers(
      dto.userIds,
      dto.title,
      dto.body,
      dto.data,
    );
  }

  // إرسال إشعار لـ Topic
  @Post('send-to-topic')
  @ApiOperation({ summary: 'Send a notification to a topic' })
  @ApiBody({ type: SendToTopicDto })
  async sendToTopic(@Body() dto: SendToTopicDto) {
    return this.notificationService.sendToTopic(dto.topic, dto.title, dto.body);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyNotifications(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const perPage = limit ? Math.max(1, Number(limit)) : 20;
    return this.notificationService.getUserNotifications(
      user.id,
      pageNum,
      perPage,
    );
  }

  // read/unread endpoints removed
}
// 3c42ee1a-ee0d-4b7b-8a02-4d3445951936
