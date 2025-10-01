// src/notification/notification.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // المستخدم يرسل التوكن للسيرفر
  @Post('register-token')
  async registerToken(
    @Body('userId') userId: number,
    @Body('token') token: string,
    @Body('deviceType') deviceType: string,
  ) {
    return this.notificationService.saveToken(userId, token, deviceType);
  }

  // إرسال إشعار لمستخدم واحد
  @Post('send-to-user')
  async sendToUser(
    @Body('userId') userId: number,
    @Body('title') title: string,
    @Body('body') body: string,
  ) {
    return this.notificationService.sendToUser(userId, title, body);
  }

  // إرسال إشعار لمجموعة مستخدمين
  @Post('send-to-many')
  async sendToMany(
    @Body('userIds') userIds: number[],
    @Body('title') title: string,
    @Body('body') body: string,
  ) {
    return this.notificationService.sendToManyUsers(userIds, title, body);
  }

  // إرسال إشعار لـ Topic
  @Post('send-to-topic')
  async sendToTopic(
    @Body('topic') topic: string,
    @Body('title') title: string,
    @Body('body') body: string,
  ) {
    return this.notificationService.sendToTopic(topic, title, body);
  }
}
