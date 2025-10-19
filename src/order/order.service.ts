import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CartService } from 'src/cart/cart.service';
import { Meal } from 'src/meal/meal.entity';
import { DeliveryLocation } from 'src/restaurant/delivery-location.entity';
import { User } from 'src/user/user.entity';
import { CreateOrderDto } from './dto/dto.create.order';
import { PayPalService } from 'src/paypal/paypal.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(DeliveryLocation)
    private deliveryLocationRepo: Repository<DeliveryLocation>,
    private cartService: CartService,
    private readonly paypalService: PayPalService,
    private readonly notificationService: NotificationService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // جلب عناصر الطلب من dto.items أو من السلة إذا لم تُرسل عناصر
    let total = 0;
    const items: OrderItem[] = [];
    const sourceItems = Array.isArray(dto.items) ? dto.items : [];
    if (sourceItems.length > 0) {
      for (const itemDto of sourceItems) {
        if (
          !itemDto ||
          typeof itemDto.mealId !== 'string' ||
          typeof itemDto.quantity !== 'number'
        ) {
          throw new BadRequestException('Invalid order item');
        }
        const meal = await this.mealRepo.findOne({
          where: { id: itemDto.mealId },
        });
        if (!meal) throw new NotFoundException('Meal not found');
        const price = meal.price * itemDto.quantity;
        total += price;
        const orderItem = this.orderItemRepo.create({
          meal,
          quantity: itemDto.quantity,
          price,
          note: itemDto.note ?? null,
        });
        items.push(orderItem);
      }
    } else {
      // السلة
      const cart = await this.cartService.getUserCart(userId);
      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        throw new BadRequestException(
          'السلة فارغة، يرجى إضافة عناصر إلى السلة قبل إنشاء الطلب',
        );
      }
      for (const cItem of cart.items) {
        const meal = cItem.meal;
        if (!meal) {
          throw new NotFoundException('Meal not found in cart item');
        }
        const quantity = cItem.quantity;
        const price = Number(meal.price) * quantity;
        total += price;
        const orderItem = this.orderItemRepo.create({
          meal,
          quantity,
          price,
          note: null,
        });
        items.push(orderItem);
      }
    }

    // جلب موقع التسليم إذا كان PICKUP_POINT
    let deliveryLocation: DeliveryLocation | undefined = undefined;
    if (dto.deliveryType === 'PICKUP_POINT' && dto.deliveryLocationId) {
      const foundLocation = await this.deliveryLocationRepo.findOne({
        where: { id: dto.deliveryLocationId },
      });
      if (!foundLocation) {
        throw new NotFoundException('Delivery location not found');
      }
      deliveryLocation = foundLocation;
    }

    // جلب المطعم من أول وجبة (يمكنك تعديله حسب منطقك)
    const restaurant = items.length > 0 ? items[0].meal.restaurant : undefined;

    // إحداثيات المستخدم إذا كان DELIVERY
    const userLatitude =
      dto.deliveryType === 'DELIVERY' ? dto.latitude : undefined;

    const userLongitude =
      dto.deliveryType === 'DELIVERY' ? dto.longitude : undefined;

    const order = this.orderRepo.create({
      user,
      restaurant,
      items,
      totalPrice: total,
      status: 'PENDING',
      deliveryType: dto.deliveryType,
      deliveryLocation: deliveryLocation ?? undefined,
      userLatitude,
      userLongitude,
      notes: dto.notes ?? undefined,
      address: dto.address ?? undefined,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });

    const saved = await this.orderRepo.save(order);

    // تنظيف السلة بعد إنشاء الطلب إذا طلب العميل ذلك
    if ((!sourceItems || sourceItems.length === 0) && dto.clearCart) {
      try {
        await this.cartService.clearCart(userId);
      } catch {
        // تجاهل خطأ تنظيف السلة حتى لا يؤثر على إنشاء الطلب
      }
    }

    return saved;
  }

  async getCurrentOrders(userId: string): Promise<Order[]> {
    // Current = not finished yet: PENDING, AUTHORIZED, UNPAID, PENDING
    return this.orderRepo.find({
      where: { user: { id: userId }, status: 'PENDING' },
      relations: ['items', 'items.meal', 'restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPreviousOrders(userId: string): Promise<Order[]> {
    // Previous orders: CONFIRMED, DELIVERED, CANCELED
    return this.orderRepo.find({
      where: [
        { user: { id: userId }, status: 'CONFIRMED' },
        { user: { id: userId }, status: 'DELIVERED' },
        { user: { id: userId }, status: 'CANCELED' },
      ],
      relations: ['items', 'items.meal', 'restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.meal'],
    });
  }

  async updateStatus(orderId: string, status: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'restaurant', 'restaurant.owner'],
    });
    if (!order) throw new NotFoundException('Order not found');
    // إذا تم التأكيد ونوع الدفع PayPal ولم يتم الدفع بعد، نفذ الالتقاط
    const prevStatus = order.status;
    order.status = status;
    const saved = await this.orderRepo.save(order);

    if (
      prevStatus !== 'CONFIRMED' &&
      status === 'CONFIRMED' &&
      order.paymentStatus !== 'PAID'
    ) {
      if (!order.paypalOrderId) {
        throw new BadRequestException('No PayPal order linked to this order');
      }
      try {
        // إذا كان هناك تفويض سابق، قم بالالتقاط من التفويض
        if (order.paypalAuthorizationId) {
          await this.paypalService.captureAuthorizedIfAny(order.id);
        } else {
          // وإلا نفذ capture/authorize حسب المتاح
          await this.paypalService.capturePaypalForOrder(order.id);
        }
        // سيتم تحديث الحقول داخل PayPalService
      } catch {
        // فشل في الـ capture -> ضع حالة الدفع FAILED وألغِ الطلب وابلّغ المستخدم والمطعم
        order.paymentStatus = 'FAILED';
        order.status = 'CANCELED';
        await this.orderRepo.save(order);

        // إرسال إشعار للعميل
        try {
          await this.notificationService.sendToUser(
            order.user.id,
            'فشل عملية الدفع',
            `عذراً، فشلت عملية السحب لطلبك ${order.id}. يرجى المحاولة لاحقاً.`,
          );
        } catch {
          // ignore notification errors
        }

        // إرسال إشعار لمالك المطعم إن وُجد
        try {
          const ownerId = order.restaurant?.owner?.id;
          if (ownerId) {
            await this.notificationService.sendToUser(
              ownerId,
              'فشل سحب الدفع لطلب',
              `الطلب ${order.id} فشل أثناء سحب المبلغ.`,
            );
          }
        } catch {
          // ignore notification errors
        }

        return order;
      }
    }

    // حالة إلغاء الطلب قبل التأكيد: void authorization وابلاغ
    if (status === 'CANCELED') {
      if (order.paypalAuthorizationId) {
        try {
          await this.paypalService.voidAuthorization(
            order.paypalAuthorizationId,
          );
          order.paymentStatus = 'FAILED';
          await this.orderRepo.save(order);

          // إشعار المستخدم
          try {
            await this.notificationService.sendToUser(
              order.user.id,
              'تم إلغاء الطلب وإلغاء الحجز',
              `تم إلغاء طلبك ${order.id} وتم رفع حجز المبلغ.`,
            );
          } catch {
            // ignore notification errors
          }

          // إشعار صاحب المطعم
          try {
            const ownerId = order.restaurant?.owner?.id;
            if (ownerId) {
              await this.notificationService.sendToUser(
                ownerId,
                'تم إلغاء الطلب',
                `الطلب ${order.id} تم إلغاؤه من قبل العميل.`,
              );
            }
          } catch {
            // ignore notification errors
          }
        } catch {
          // لو فشل الـ void، سجّل وفشل بهدوء، لكن نعيد الحالة للمستخدم
          order.paymentStatus = 'FAILED';
          await this.orderRepo.save(order);
        }
      }
    }
    return saved;
  }

  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'restaurant', 'restaurant.owner'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (String(order.user.id) !== String(userId)) {
      throw new BadRequestException('Not allowed to cancel this order');
    }

    // Only allow cancel for certain statuses
    if (['CONFIRMED', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException(
        'Cannot cancel a confirmed or delivered order',
      );
    }

    // If there is an authorization (authorized but not captured) -> void it
    if (order.paypalAuthorizationId) {
      try {
        await this.paypalService.voidAuthorization(order.paypalAuthorizationId);
        order.paymentStatus = 'FAILED';
      } catch (_err) {
        // if void fails, mark payment as FAILED but still cancel order
        console.warn('voidAuthorization failed', _err);
        order.paymentStatus = 'FAILED';
      }
      order.status = 'CANCELED';
      await this.orderRepo.save(order);

      // notify user
      try {
        await this.notificationService.sendToUser(
          order.user.id,
          'تم إلغاء الطلب',
          `تم إلغاء طلبك ${order.id}. ${reason ?? ''}`,
        );
      } catch (_err) {
        console.warn('notify user failed', _err);
      }

      // notify restaurant owner
      try {
        const ownerId = order.restaurant?.owner?.id;
        if (ownerId) {
          await this.notificationService.sendToUser(
            ownerId,
            'تم إلغاء طلب',
            `تم إلغاء الطلب ${order.id} من قبل العميل. ${reason ?? ''}`,
          );
        }
      } catch (_err) {
        console.warn('notify owner failed', _err);
      }

      return order;
    }

    // If already captured (paid) -> attempt refund
    if (order.paypalCaptureId) {
      try {
        // create a refund; this may be async depending on PayPal response
        await this.paypalService.refundCapture(order.paypalCaptureId);
        order.paymentStatus = 'REFUNDED';
        order.status = 'CANCELED';
      } catch (_err) {
        // refund failed: set paymentStatus to FAILED_REFUND or keep PAID and mark refund pending
        console.warn('refund failed', _err);
        order.paymentStatus = 'FAILED';
        // still mark canceled? keep canceled but note refund failed
        order.status = 'CANCELED';
      }
      await this.orderRepo.save(order);

      try {
        await this.notificationService.sendToUser(
          order.user.id,
          'تم إلغاء الطلب',
          `تم إلغاء طلبك ${order.id}. سيتم معالجة الاسترداد إن وُجد. ${reason ?? ''}`,
        );
      } catch (_err) {
        console.warn('notify user failed', _err);
      }

      try {
        const ownerId = order.restaurant?.owner?.id;
        if (ownerId) {
          await this.notificationService.sendToUser(
            ownerId,
            'تم إلغاء طلب',
            `تم إلغاء الطلب ${order.id} بواسطة العميل. ${reason ?? ''}`,
          );
        }
      } catch (_err) {
        console.warn('notify owner failed', _err);
      }

      return order;
    }

    // No paypal ids: simple cancel
    order.status = 'CANCELED';
    order.paymentStatus = 'FAILED';
    await this.orderRepo.save(order);
    try {
      await this.notificationService.sendToUser(
        order.user.id,
        'تم إلغاء الطلب',
        `تم إلغاء طلبك ${order.id}. ${reason ?? ''}`,
      );
    } catch (_err) {
      console.warn('notify user failed', _err);
    }
    try {
      const ownerId = order.restaurant?.owner?.id;
      if (ownerId) {
        await this.notificationService.sendToUser(
          ownerId,
          'تم إلغاء طلب',
          `تم إلغاء الطلب ${order.id} بواسطة العميل. ${reason ?? ''}`,
        );
      }
    } catch (_err) {
      console.warn('notify owner failed', _err);
    }

    return order;
  }
}
