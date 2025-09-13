/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
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
      where: { user: { id: userId } },
      relations: ['items', 'items.meal'],
    });

    if (!cart) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      cart = this.cartRepo.create({ user, items: [] });
      cart = await this.cartRepo.save(cart);
    }
    return cart;
  }

  async addItem(userId: string, mealId: string, quantity = 1): Promise<Cart> {
    const cart = await this.getUserCart(userId);
    const meal = await this.mealRepo.findOne({ where: { id: mealId } });
    if (!meal) throw new NotFoundException('Meal not found');

    let item = cart.items.find((i) => i.meal.id === mealId);
    if (item) {
      item.quantity += quantity;
    } else {
      item = this.cartItemRepo.create({ cart, meal, quantity });
      cart.items.push(item);
    }

    await this.cartItemRepo.save(item);
    return this.getUserCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getUserCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found');
    await this.cartItemRepo.remove(item);
    return this.getUserCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getUserCart(userId);
    await this.cartItemRepo.remove(cart.items);
  }
}
