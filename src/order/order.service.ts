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
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // جلب عناصر الطلب من dto.items وجلب الكيانات الحقيقية
    let total = 0;
    const items: OrderItem[] = [];
    if (!Array.isArray(dto.items)) {
      throw new NotFoundException('Order items must be an array');
    }
    for (const itemDto of dto.items) {
      if (
        !itemDto ||
        typeof itemDto.mealId !== 'string' ||
        typeof itemDto.quantity !== 'number'
      ) {
        throw new NotFoundException('Invalid order item');
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
      });
      items.push(orderItem);
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
    });

    return this.orderRepo.save(order);
  }

  async getOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.meal'],
    });
  }

  async updateStatus(orderId: string, status: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
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
      await this.paypalService.capturePaypalForOrder(order.id);
      // سيتم تحديث الحقول داخل PayPalService
    }
    return saved;
  }
}
