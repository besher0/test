/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/notification/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserToken } from './notification.entity';
import { UserNotification } from './user-notification.entity';
import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from './firebase-admin';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(UserToken)
    private readonly tokenRepo: Repository<UserToken>,
    @InjectRepository(UserNotification)
    private readonly notificationRepo?: Repository<UserNotification>,
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
  async sendToUser(
    userId: string | number,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    initializeFirebaseAdmin();

    // persist notification record (best-effort) even if no tokens
    try {
      if (this.notificationRepo) {
        const n = this.notificationRepo.create({
          user: { id: String(userId) } as any,
          title,
          body,
          data: data ?? null,
        });
        await this.notificationRepo.save(n);
      }
    } catch (e) {
      console.warn('failed to persist notification', e);
    }

    const tokenEntities = await this.tokenRepo.find({
      where: { user: { id: String(userId) } as any },
    });
    if (!tokenEntities.length) return;

    // Deduplicate tokens to avoid duplicate sends
    const uniqueMap = new Map<string, UserToken>();
    for (const t of tokenEntities) uniqueMap.set(t.token, t);
    const tokens = Array.from(uniqueMap.keys());

    const message: admin.messaging.MulticastMessage = {
      notification: { title, body },
      tokens,
      data: data ? { payload: JSON.stringify(data) } : undefined,
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
    data?: Record<string, unknown>,
  ) {
    initializeFirebaseAdmin();

    // persist notifications for all targeted users (best-effort)
    try {
      if (this.notificationRepo) {
        const repo = this.notificationRepo;
        const records = userIds
          .map((id) =>
            repo.create({
              user: { id: String(id) } as any,
              title,
              body,
              data: data ?? null,
            }),
          )
          .filter(Boolean);
        if (records.length) await repo.save(records);
      }
    } catch (e) {
      console.warn('failed to persist many notifications', e);
    }

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
      // send a global payload if provided
      data: data ? { payload: JSON.stringify(data) } : undefined,
    };

    const res = await admin.messaging().sendEachForMulticast(message);
    await this.cleanupInvalidTokens(Array.from(uniqueMap.values()), res);
    return res;
  }

  // fetch paginated notifications for a user
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    if (!this.notificationRepo) return { items: [], total: 0, page, limit };
    const take = limit;
    const [items, total] = await this.notificationRepo.findAndCount({
      where: { user: { id: String(userId) } as any },
      order: { createdAt: 'DESC' },
      take,
      skip: (page - 1) * take,
    });
    const totalPages = Math.ceil(total / take);
    const isLastPage = total === 0 ? true : page >= totalPages;
    return {
      items,
      total,
      page,
      limit: take,
      totalPages,
      isLastPage,
    };
  }

  // (read/unread tracking removed)

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
