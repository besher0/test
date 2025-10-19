/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Meal } from 'src/meal/meal.entity';
import { User } from 'src/user/user.entity';
import { AddToCartDto } from './dto/dto.createCart';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
    @InjectRepository(Meal) private mealRepo: Repository<Meal>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}
  // eslint-disable-next-line @typescript-eslint/require-await
  private async calculateCartTotal(cart: Cart): Promise<number> {
    let total = 0;
    for (const item of cart.items) {
      if (item.meal && item.meal.price) {
        total += item.quantity * parseFloat(item.meal.price as any);
      }
    }
    return total;
  }
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
    cart.total = await this.calculateCartTotal(cart);
    return cart;  }

async addItem(
    userId: string,
    mealId: string,
    quantity = 1,
  ) {
    if (!mealId) {
      throw new BadRequestException('mealId is required');
    }
    
    const meal = await this.mealRepo.findOne({
      where: { id: mealId },
      relations: ['restaurant'],
    });
    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.meal', 'items.meal.restaurant'],
    });

    let isNewCart = false;
    if (!cart) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      cart = this.cartRepo.create({ userId, user, items: [] });
      isNewCart = true;
    }

    if (cart.items.length > 0) {
      const existingRestaurantId = cart.items[0].meal.restaurant.id;
      if (existingRestaurantId !== meal.restaurant.id) {
        throw new BadRequestException(
          'لا يمكنك الطلب من أكثر من مطعم في نفس السلة',
        );
      }
    }

    const existing = cart.items.find((i) => i.meal.id === meal.id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }
      if (newQty !== existing.quantity) {
        await this.cartItemRepo.update(existing.id, { quantity: newQty });
        existing.quantity = newQty;
      }
    } else {
      // احفظ السلة أولاً إذا كانت جديدة (لضمان وجود cart.id)
      if (isNewCart) {
        cart = await this.cartRepo.save(cart);
        isNewCart = false;
      }
      const newItem = this.cartItemRepo.create({ meal, quantity, cart });
      await this.cartItemRepo.save(newItem);
      cart.items.push(newItem);
    }
    
    // إعادة تحميل السلة لحساب المجموع بشكل صحيح
    const updatedCart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.meal', 'items.meal.restaurant'],
    });
    
    // حساب المجموع وتحديثه قبل الإرجاع
    if (!updatedCart) {
      throw new NotFoundException('Cart not found after update');
    }
    updatedCart.total = await this.calculateCartTotal(updatedCart);
    // حدّث حقل total فقط لتجنب أي تحديث فارغ
    await this.cartRepo.update(updatedCart.id, { total: updatedCart.total });
    return updatedCart;
  }

  async addMultipleItems(
  userId: string,
  items: AddToCartDto[],
): Promise<Cart> {
  if (!items || items.length === 0) {
    throw new BadRequestException('No items provided');
  }


  for (const item of items) {
    const { mealId, quantity=1 } = item;
    await this.addItem(userId, mealId, quantity);
  }

  return this.getUserCart(userId);
}

async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getUserCart(userId);
    if (!cart) throw new NotFoundException('Cart not found');
    
    await this.cartItemRepo.delete(itemId);
    cart.items = cart.items.filter((item) => item.id !== itemId);
    
    cart.total = await this.calculateCartTotal(cart);
    return this.cartRepo.save(cart);
  }

  async clearCart(userId: string) {
    const cart = await this.getUserCart(userId);
    if (!cart) throw new NotFoundException('Cart not found');

    await this.cartItemRepo.delete({ cart: { id: cart.id } });
    cart.items = [];
    cart.total = 0;
    return this.cartRepo.save(cart);
  }
}
