import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
import { In } from 'typeorm';
import { Restaurant } from 'src/restaurant/restaurant.entity';

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

  async createOrder(userId: string, dto: CreateOrderDto): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // جلب عناصر الطلب من dto.items أو من السلة إذا لم تُرسل عناصر
    let total = 0;
    const items: OrderItem[] = [];
    const sourceItems = Array.isArray(dto.items) ? dto.items : [];
    if (!sourceItems || sourceItems.length === 0) {
      throw new BadRequestException('Items are required in the request body');
    }
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
          relations: ['restaurant', 'restaurant.owner'],
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
        let meal = cItem.meal;
        if (!meal) {
          throw new NotFoundException('Meal not found in cart item');
        }
        // ensure meal has restaurant relation loaded
        if (!meal.restaurant) {
          const mealFull = await this.mealRepo.findOne({
            where: { id: meal.id },
            relations: ['restaurant', 'restaurant.owner'],
          });
          if (mealFull) meal = mealFull;
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

    // Reload saved order with relations so restaurant/user data are populated
    const full = await this.orderRepo.findOne({
      where: { id: saved.id },
      relations: [
        'items',
        'items.meal',
        'restaurant',
        'restaurant.owner',
        'user',
        'deliveryLocation',
      ],
    });

    // Notify restaurant owner about new order (best-effort)
    try {
      const ownerId = full?.restaurant?.owner?.id;
      if (ownerId) {
        // include per-item notes in the notification payload so owner app can show them
        const itemsForOwner = (full.items || []).map((it) => ({
          id: it.id,
          mealId: it.meal?.id ?? null,
          name: it.meal?.name ?? null,
          quantity: it.quantity,
          price: it.price,
          note: it.note ?? null,
        }));

        await this.notificationService.sendToUser(
          ownerId,
          'طلب جديد',
          `لقد وصلك طلب جديد (${full.id}) من ${user.firstName} ${user.lastName}`,
          {
            type: 'new_order',
            orderId: full.id,
            items: itemsForOwner,
            timestamp: new Date().toISOString(),
          },
        );
      }
    } catch {
      // ignore notification errors
    }

    // تنظيف السلة بعد إنشاء الطلب إذا طلب العميل ذلك (optional)
    if (dto.clearCart) {
      try {
        await this.cartService.clearCart(userId);
      } catch {
        // ignore clear cart errors
      }
    }

    // return the same shape as the GET endpoints (map for user)
    return this.mapOrderForUser((full as unknown as Order) ?? saved);
  }

  async getCurrentOrders(userId: string): Promise<any[]> {
    // Current = not finished yet: PENDING
    const orders = await this.orderRepo.find({
      where: { user: { id: userId }, status: 'PENDING' },
      relations: [
        'items',
        'items.meal',
        'restaurant',
        'restaurant.owner',
        'user',
        'deliveryLocation',
      ],
      order: { createdAt: 'DESC' },
    });
    return orders.map((o) => this.mapOrderForUser(o));
  }

  async getPreviousOrders(userId: string): Promise<any[]> {
    // Previous orders: CONFIRMED, DELIVERED, CANCELED
    const orders = await this.orderRepo.find({
      where: [
        { user: { id: userId }, status: 'CONFIRMED' },
        { user: { id: userId }, status: 'DELIVERED' },
        { user: { id: userId }, status: 'CANCELED' },
      ],
      relations: [
        'items',
        'items.meal',
        'restaurant',
        'restaurant.owner',
        'user',
        'deliveryLocation',
      ],
      order: { createdAt: 'DESC' },
    });
    return orders.map((o) => this.mapOrderForUser(o));
  }

  // Orders for restaurant owners: current (not confirmed yet)
  async getOwnerCurrentOrders(
    ownerId: string,
    page = 1,
    limit = 8,
  ): Promise<{
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    isLastPage: boolean;
    orders: any[];
  }> {
    // Verify owner actually has at least one restaurant/store
    const ownsAny = await this.orderRepo.manager.findOne(Restaurant, {
      where: { owner: { id: ownerId } },
    });
    if (!ownsAny) {
      throw new ForbiddenException('User does not own any business');
    }

    // Order.status supports: PENDING, CONFIRMED, DELIVERED, CANCELED
    const statuses = ['PENDING'];
    const take = limit;
    const skip = (page - 1) * take;
    const [orders, total] = await this.orderRepo.findAndCount({
      where: { restaurant: { owner: { id: ownerId } }, status: In(statuses) },
      relations: [
        'items',
        'items.meal',
        'restaurant',
        'restaurant.owner',
        'user',
        'deliveryLocation',
      ],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    const totalPages = Math.ceil(total / take);
    const isLastPage = total === 0 ? true : page >= totalPages;
    // Map to lightweight DTO for owner
    const ordersDto = orders.map((o) => this.mapOrderForOwner(o));
    return {
      page,
      perPage: take,
      total,
      totalPages,
      isLastPage,
      orders: ordersDto,
    };
  }

  /**
   * Returns unconfirmed orders for owner (PENDING/AUTHORIZED/UNPAID) with monthly stats
   * stats: { monthSales: number, completedOrdersThisMonth: number }
   */
  async getOwnerUnconfirmedWithStats(
    ownerId: string,
    page = 1,
    limit = 8,
  ): Promise<{
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    isLastPage: boolean;
    orders: any[];
    stats: { monthSales: number; completedOrdersThisMonth: number };
  }> {
    // Verify owner actually has at least one restaurant/store
    const ownsAny = await this.orderRepo.manager.findOne(Restaurant, {
      where: { owner: { id: ownerId } },
    });
    if (!ownsAny) {
      throw new ForbiddenException('User does not own any business');
    }

    // Order.status supports: PENDING, CONFIRMED, DELIVERED, CANCELED
    const statuses = ['PENDING'];
    const take = limit;
    const skip = (page - 1) * take;
    const [orders, total] = await this.orderRepo.findAndCount({
      where: { restaurant: { owner: { id: ownerId } }, status: In(statuses) },
      relations: [
        'items',
        'items.meal',
        'restaurant',
        'restaurant.owner',
        'user',
        'deliveryLocation',
      ],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    const totalPages = Math.ceil(total / take);
    const isLastPage = total === 0 ? true : page >= totalPages;
    const ordersDto = orders.map((o) => this.mapOrderForOwner(o));

    // Compute monthly stats for current month (based on createdAt)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);

    // Total sales for month: sum of totalPrice for orders of this owner's restaurants that are CONFIRMED or DELIVERED in the month
    const salesQuery = this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.totalPrice)', 'sum')
      // join restaurant and its owner, then filter by owner id (safe across naming strategies)
      .innerJoin('order.restaurant', 'r')
      .innerJoin('r.owner', 'o')
      .where('o.id = :ownerId', { ownerId })
      .andWhere('order.createdAt >= :start', {
        start: monthStart.toISOString(),
      })
      .andWhere('order.createdAt < :end', { end: monthEnd.toISOString() })
      .andWhere('order.status IN (:...s)', { s: ['CONFIRMED', 'DELIVERED'] });

    const salesResult: { sum: string | null } | undefined =
      await salesQuery.getRawOne();
    const monthSales = Number(salesResult?.sum ?? 0) || 0;

    // Completed orders this month: count of orders with status CONFIRMED or DELIVERED in the month
    const countQuery = this.orderRepo
      .createQueryBuilder('order')
      .select('COUNT(1)', 'count')
      .innerJoin('order.restaurant', 'r')
      .innerJoin('r.owner', 'o')
      .where('o.id = :ownerId', { ownerId })
      .andWhere('order.createdAt >= :start', {
        start: monthStart.toISOString(),
      })
      .andWhere('order.createdAt < :end', { end: monthEnd.toISOString() })
      .andWhere('order.status IN (:...s)', { s: ['CONFIRMED', 'DELIVERED'] });

    const countResult: { count: string } | undefined =
      await countQuery.getRawOne();
    const completedOrdersThisMonth = Number(countResult?.count ?? 0) || 0;

    return {
      page,
      perPage: take,
      total,
      totalPages,
      isLastPage,
      orders: ordersDto,
      stats: { monthSales, completedOrdersThisMonth },
    };
  }

  // Orders for restaurant owners: previous (confirmed/delivered/canceled)
  async getOwnerPreviousOrders(
    ownerId: string,
    page = 1,
    limit = 8,
  ): Promise<{
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    isLastPage: boolean;
    orders: any[];
  }> {
    // Verify owner actually has at least one restaurant/store
    const ownsAny = await this.orderRepo.manager.findOne(Restaurant, {
      where: { owner: { id: ownerId } },
    });
    if (!ownsAny) {
      throw new ForbiddenException('User does not own any business');
    }

    const statuses = ['CONFIRMED', 'DELIVERED', 'CANCELED'];
    const take = limit;
    const skip = (page - 1) * take;
    const [orders, total] = await this.orderRepo.findAndCount({
      where: { restaurant: { owner: { id: ownerId } }, status: In(statuses) },
      relations: [
        'items',
        'items.meal',
        'restaurant',
        'restaurant.owner',
        'user',
        'deliveryLocation',
      ],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    const totalPages = Math.ceil(total / take);
    const isLastPage = total === 0 ? true : page >= totalPages;
    const ordersDto = orders.map((o) => this.mapOrderForOwner(o));
    return {
      page,
      perPage: take,
      total,
      totalPages,
      isLastPage,
      orders: ordersDto,
    };
  }

  private mapOrderForOwner(order: Order) {
    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      restaurant: order.restaurant
        ? {
            id: order.restaurant.id,
            name: order.restaurant.name,
            location: order.restaurant.location,
            logo_url: order.restaurant.logo_url,
            mainImage: order.restaurant.mainImage,
            isActive: order.restaurant.isActive,
            owner: order.restaurant.owner
              ? {
                  id: order.restaurant.owner.id,
                  firstName: order.restaurant.owner.firstName,
                  lastName: order.restaurant.owner.lastName,
                  email: order.restaurant.owner.email,
                }
              : null,
          }
        : null,
      user: order.user
        ? {
            id: order.user.id,
            firstName: order.user.firstName,
            lastName: order.user.lastName,
            email: order.user.email,
            profile_picture: order.user.profile_picture ?? null,
          }
        : null,
      deliveryType: order.deliveryType,
      deliveryLocation: order.deliveryLocation
        ? {
            id: order.deliveryLocation.id,
            name: order.deliveryLocation.name,
            description: order.deliveryLocation.description ?? null,
            latitude: Number(order.deliveryLocation.latitude),
            longitude: Number(order.deliveryLocation.longitude),
          }
        : null,
      address: order.address ?? null,
      scheduledAt: order.scheduledAt ?? null,
      userLatitude: order.userLatitude ?? null,
      userLongitude: order.userLongitude ?? null,
      items: (order.items || []).map((it) => ({
        id: it.id,
        mealId: it.meal?.id ?? null,
        name: it.meal?.name ?? null,
        mealImage: it.meal?.image_url ?? null,
        quantity: it.quantity,
        price: it.price,
        note: it.note ?? null,
      })),
    };
  }

  private mapOrderForUser(order: Order) {
    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      restaurant: order.restaurant
        ? {
            id: order.restaurant.id,
            name: order.restaurant.name,
            location: order.restaurant.location,
            logo_url: order.restaurant.logo_url,
            mainImage: order.restaurant.mainImage,
            owner: order.restaurant.owner
              ? {
                  id: order.restaurant.owner.id,
                  firstName: order.restaurant.owner.firstName,
                  lastName: order.restaurant.owner.lastName,
                  email: order.restaurant.owner.email,
                }
              : null,
          }
        : null,
      user: order.user
        ? {
            id: order.user.id,
            firstName: order.user.firstName,
            lastName: order.user.lastName,
            email: order.user.email,
            profile_picture: order.user.profile_picture ?? null,
          }
        : null,
      deliveryType: order.deliveryType,
      deliveryLocation: order.deliveryLocation
        ? {
            id: order.deliveryLocation.id,
            name: order.deliveryLocation.name,
            description: order.deliveryLocation.description ?? null,
            latitude: Number(order.deliveryLocation.latitude),
            longitude: Number(order.deliveryLocation.longitude),
          }
        : null,
      address: order.address ?? null,
      scheduledAt: order.scheduledAt ?? null,
      userLatitude: order.userLatitude ?? null,
      userLongitude: order.userLongitude ?? null,
      items: (order.items || []).map((it) => ({
        id: it.id,
        mealId: it.meal?.id ?? null,
        name: it.meal?.name ?? null,
        mealImage: it.meal?.image_url ?? null,
        quantity: it.quantity,
        price: it.price,
        note: it.note ?? null,
      })),
    };
  }

  async getOrders(userId: string): Promise<any[]> {
    const orders = await this.orderRepo.find({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.meal',
        'restaurant',
        'restaurant.owner',
        'user',
      ],
      order: { createdAt: 'DESC' },
    });
    return orders.map((o) => this.mapOrderForUser(o));
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
        // If capture fails, mark payment as FAILED and cancel the order.
        order.paymentStatus = 'FAILED';
        order.status = 'CANCELED';
        await this.orderRepo.save(order);

        // Notify the customer about failure
        try {
          await this.notificationService.sendToUser(
            order.user.id,
            'فشل عملية الدفع',
            `عذراً، فشلت عملية السحب لطلبك ${order.id}. يرجى المحاولة لاحقاً.`,
            {
              type: 'order_status',
              orderId: order.id,
              status: order.status,
              color: 'red',
              timestamp: new Date().toISOString(),
            },
          );
        } catch {
          // ignore notification errors
        }

        // Notify restaurant owner if present
        try {
          const ownerId = order.restaurant?.owner?.id;
          if (ownerId) {
            await this.notificationService.sendToUser(
              ownerId,
              'فشل سحب الدفع لطلب',
              `الطلب ${order.id} فشل أثناء سحب المبلغ.`,
              {
                type: 'order_status',
                orderId: order.id,
                status: order.status,
                color: 'red',
                timestamp: new Date().toISOString(),
              },
            );
          }
        } catch {
          // ignore notification errors
        }

        return order;
      }
    }

    // Notify user when order gets confirmed (after any capture) or delivered
    try {
      if (prevStatus !== 'CONFIRMED' && status === 'CONFIRMED') {
        await this.notificationService.sendToUser(
          order.user.id,
          'تم تأكيد الطلب',
          `طلبك ${order.id} تم تأكيده وسيتم التحضير قريباً.`,
          {
            type: 'order_status',
            orderId: order.id,
            status: 'CONFIRMED',
            color: 'green',
            timestamp: new Date().toISOString(),
          },
        );
      }
      if (prevStatus !== 'DELIVERED' && status === 'DELIVERED') {
        await this.notificationService.sendToUser(
          order.user.id,
          'تم توصيل الطلب',
          `تم توصيل طلبك ${order.id}. نتمنى أن تكون وجبتك لذيذة!`,
          {
            type: 'order_status',
            orderId: order.id,
            status: 'DELIVERED',
            color: 'green',
            timestamp: new Date().toISOString(),
          },
        );
      }
    } catch {
      // ignore notification errors
    }

    // General cancellation notification: cover owner-initiated cancels and other cases
    try {
      if (prevStatus !== 'CANCELED' && status === 'CANCELED') {
        // notify customer
        await this.notificationService.sendToUser(
          order.user.id,
          'تم إلغاء الطلب',
          `تم إلغاء طلبك ${order.id}. سنعمل على التوضيح مع المطعم إذا لزم الأمر.`,
          {
            type: 'order_status',
            orderId: order.id,
            status: 'CANCELED',
            color: 'red',
            timestamp: new Date().toISOString(),
          },
        );

        // notify restaurant owner as acknowledgement
        const ownerId = order.restaurant?.owner?.id;
        if (ownerId) {
          await this.notificationService.sendToUser(
            ownerId,
            'تم إلغاء الطلب',
            `الطلب ${order.id} تم إلغاؤه.`,
            {
              type: 'order_status',
              orderId: order.id,
              status: 'CANCELED',
              color: 'red',
              timestamp: new Date().toISOString(),
            },
          );
        }
      }
    } catch {
      // ignore notification errors
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
              {
                type: 'order_status',
                orderId: order.id,
                status: 'CANCELED',
                color: 'red',
                timestamp: new Date().toISOString(),
              },
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
                {
                  type: 'order_status',
                  orderId: order.id,
                  status: 'CANCELED',
                  color: 'red',
                  timestamp: new Date().toISOString(),
                },
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
          {
            type: 'order_status',
            orderId: order.id,
            status: 'CANCELED',
            color: 'red',
            timestamp: new Date().toISOString(),
          },
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
            {
              type: 'order_status',
              orderId: order.id,
              status: 'CANCELED',
              color: 'red',
              timestamp: new Date().toISOString(),
            },
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
          {
            type: 'order_status',
            orderId: order.id,
            status: 'CANCELED',
            color: 'red',
            timestamp: new Date().toISOString(),
          },
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
            {
              type: 'order_status',
              orderId: order.id,
              status: 'CANCELED',
              color: 'red',
              timestamp: new Date().toISOString(),
            },
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
        {
          type: 'order_status',
          orderId: order.id,
          status: 'CANCELED',
          color: 'red',
          timestamp: new Date().toISOString(),
        },
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
          {
            type: 'order_status',
            orderId: order.id,
            status: 'CANCELED',
            color: 'red',
            timestamp: new Date().toISOString(),
          },
        );
      }
    } catch (_err) {
      console.warn('notify owner failed', _err);
    }

    return order;
  }

  // Owner rejects an order (ownerId = restaurant.owner.id)
  async ownerRejectOrder(
    ownerId: string,
    orderId: string,
    reason?: string,
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'restaurant', 'restaurant.owner'],
    });
    if (!order) throw new NotFoundException('Order not found');

    const owner = order.restaurant?.owner;
    if (!owner || String(owner.id) !== String(ownerId)) {
      throw new ForbiddenException('Not allowed to reject this order');
    }

    // mark canceled/rejected
    order.status = 'CANCELED';
    await this.orderRepo.save(order);

    // notify customer about rejection (persisted by NotificationService)
    try {
      const bodyText = reason
        ? `طلبك ${order.id} رُفض: ${reason}`
        : `تم رفض طلبك ${order.id} من قبل المطعم`;
      await this.notificationService.sendToUser(
        order.user.id,
        'تم رفض الطلب',
        bodyText,
        {
          type: 'order_status',
          orderId: order.id,
          status: 'CANCELED',
          reason: reason ?? null,
          color: 'red',
          timestamp: new Date().toISOString(),
        },
      );
    } catch (e) {
      // ignore notification failures
      console.warn('Failed to send rejection notification', e);
    }

    // send confirmation notification to the owner (persisted)
    try {
      const ownerId = order.restaurant?.owner?.id;
      if (ownerId) {
        const ownerBody = reason
          ? `لقد رفضت الطلب ${order.id}. السبب: ${reason}`
          : `تم رفض الطلب ${order.id} وتم تنفيذ الإجراء.`;
        await this.notificationService.sendToUser(
          ownerId,
          'تم تنفيذ رفض الطلب',
          ownerBody,
          {
            type: 'order_action',
            orderId: order.id,
            action: 'REJECTED',
            reason: reason ?? null,
            color: 'red',
            timestamp: new Date().toISOString(),
          },
        );
      }
    } catch (e) {
      console.warn('Failed to send owner confirmation notification', e);
    }

    return order;
  }
}
