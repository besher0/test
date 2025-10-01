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
    const tokenEntities = await this.tokenRepo.find({
      where: { user: { id: String(userId) } as any },
    });
    if (!tokenEntities.length) return;

    // Deduplicate tokens to avoid duplicate sends
    const uniqueMap = new Map<string, UserToken>();
    for (const t of tokenEntities) uniqueMap.set(t.token, t);
    const tokens = Array.from(uniqueMap.keys());

    const message = {
      notification: { title, body },
      tokens,
    };

    const res = await admin.messaging().sendEachForMulticast(message);
    await this.cleanupInvalidTokens(Array.from(uniqueMap.values()), res);
    return res;
  }

  // إشعار لعدة مستخدمين
  async sendToManyUsers(
    userIds: Array<string | number>,
    title: string,
    body: string,
  ) {
    initializeFirebaseAdmin();
    const tokenEntities = await this.tokenRepo.find({
      where: { user: { id: In(userIds.map(String)) } as any },
    });
    if (!tokenEntities.length) return;

    // Deduplicate across all users
    const uniqueMap = new Map<string, UserToken>();
    for (const t of tokenEntities) uniqueMap.set(t.token, t);
    const tokens = Array.from(uniqueMap.keys());

    const message = {
      notification: { title, body },
      tokens,
    };

    const res = await admin.messaging().sendEachForMulticast(message);
    await this.cleanupInvalidTokens(Array.from(uniqueMap.values()), res);
    return res;
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

  // حذف التوكنات غير الصالحة بعد الإرسال لتجنب فشل الإرسال لاحقاً
  private async cleanupInvalidTokens(
    tokenEntities: UserToken[],
    res: admin.messaging.BatchResponse,
  ) {
    if (!res || !res.responses || !res.responses.length) return;

    // أخطاء يجب حذف توكنها نهائياً
    const removableCodes = new Set<string>([
      'messaging/registration-token-not-registered',
      'messaging/invalid-argument', // صيغة توكن غير صالحة
      'messaging/invalid-registration-token',
    ]);

    const idsToDelete: number[] = [];
    res.responses.forEach((r, idx) => {
      if (!r.success && r.error && removableCodes.has(r.error.code)) {
        const entity = tokenEntities[idx];
        if (entity?.id) idsToDelete.push(entity.id);
      }
    });

    if (idsToDelete.length > 0) {
      await this.tokenRepo.delete(idsToDelete);
    }
  }
}
