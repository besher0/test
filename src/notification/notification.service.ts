/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/notification/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserToken } from './notification.entity';
import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from './firebase-admin';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(UserToken)
    private readonly tokenRepo: Repository<UserToken>,
  ) {}

  // حفظ أو تحديث التوكن
  async saveToken(userId: string | number, token: string, deviceType: string) {
    initializeFirebaseAdmin();
    let userToken = await this.tokenRepo.findOne({ where: { token } });

    if (!userToken) {
      userToken = this.tokenRepo.create({
        user: { id: String(userId) } as any,
        token,
        deviceType,
      });
    } else {
      userToken.user = { id: String(userId) } as any;
      userToken.deviceType = deviceType;
    }

    return this.tokenRepo.save(userToken);
  }

  // إشعار لمستخدم واحد (كل أجهزته)
  async sendToUser(userId: string | number, title: string, body: string) {
    initializeFirebaseAdmin();
    const tokens = await this.tokenRepo.find({
      where: { user: { id: String(userId) } as any },
    });
    if (!tokens.length) return;

    const message = {
      notification: { title, body },
      tokens: tokens.map((t) => t.token),
    };

    return admin.messaging().sendEachForMulticast(message);
  }

  // إشعار لعدة مستخدمين
  async sendToManyUsers(
    userIds: Array<string | number>,
    title: string,
    body: string,
  ) {
    initializeFirebaseAdmin();
    const tokens = await this.tokenRepo.find({
      where: { user: { id: In(userIds.map(String)) } as any },
    });
    if (!tokens.length) return;

    const message = {
      notification: { title, body },
      tokens: tokens.map((t) => t.token),
    };

    return admin.messaging().sendEachForMulticast(message);
  }

  // إشعار باستخدام Topic
  async sendToTopic(topic: string, title: string, body: string) {
    initializeFirebaseAdmin();
    const message = {
      notification: { title, body },
      topic,
    };

    return await admin.messaging().send(message);
  }
}
