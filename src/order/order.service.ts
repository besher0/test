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
import { User } from 'src/user/user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private cartService: CartService,
  ) {}

  async createOrder(userId: string): Promise<Order> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const cart = await this.cartService.getUserCart(userId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    let total = 0;
    const items = cart.items.map((cartItem) => {
      const orderItem = this.orderItemRepo.create({
        meal: cartItem.meal,
        quantity: cartItem.quantity,
        price: Number(cartItem.meal.price) * cartItem.quantity,
      });
      total += orderItem.price;
      return orderItem;
    });

    const order = this.orderRepo.create({
      user,
      items,
      totalPrice: total,
      status: 'PENDING',
    });

    await this.cartService.clearCart(userId);
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
    order.status = status;
    return this.orderRepo.save(order);
  }
}
