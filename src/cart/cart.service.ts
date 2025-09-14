/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Meal } from 'src/meal/meal.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getUserCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.meal', 'items.meal.restaurant'],
    });

    if (!cart) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      cart = this.cartRepo.create({ userId, user, items: [] });
      cart = await this.cartRepo.save(cart);
    }
    return cart;
  }

  async addItem(userId: string, mealId: string, quantity = 1): Promise<Cart> {
    const meal = await this.mealRepo.findOne({
      where: { id: mealId },
      relations: ['restaurant'],
    });
    if (!meal) throw new NotFoundException('Meal not found');

    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.meal', 'items.meal.restaurant'],
    });

    if (!cart) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      cart = this.cartRepo.create({ userId, user, items: [] });
      cart = await this.cartRepo.save(cart);
    }

    // ✅ تأكد أنه من نفس المطعم
    if (cart.items.length > 0) {
      const existingRestaurantId = cart.items[0].meal.restaurant.id;
      if (existingRestaurantId !== meal.restaurant.id) {
        throw new BadRequestException(
          'You can only order from one restaurant at a time',
        );
      }
    }

    // ✅ تحقق إذا الأكلة موجودة
    let item = cart.items.find((i) => i.meal.id === mealId);
    if (item) {
      item.quantity += quantity;
      await this.cartItemRepo.save(item);
    } else {
      item = this.cartItemRepo.create({ meal, quantity, cart });
      await this.cartItemRepo.save(item);
      cart.items.push(item);
    }

    return this.cartRepo.save(cart);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getUserCart(userId);
    if (!cart) throw new NotFoundException('Cart not found');

    await this.cartItemRepo.delete(itemId);
    cart.items = cart.items.filter((item) => item.id !== itemId);

    return this.cartRepo.save(cart);
  }

  async clearCart(userId: string) {
    const cart = await this.getUserCart(userId);
    if (!cart) throw new NotFoundException('Cart not found');

    await this.cartItemRepo.delete({ cart: { id: cart.id } });
    cart.items = [];

    return this.cartRepo.save(cart);
  }
}
