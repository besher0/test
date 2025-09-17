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

async addItem(
  userId: string,
  mealId: string,
  quantity: number,
): Promise<Cart> {
  console.log('➡️ addItem called with:', { userId, mealId, quantity });

  // ✅ 0. تحقق من المدخلات
  if (!mealId) {
    console.error('❌ mealId is missing');
    throw new BadRequestException('mealId is required');
  }
  if (!quantity || quantity <= 0) {
    console.error('❌ Invalid quantity:', quantity);
    throw new BadRequestException('quantity must be greater than 0');
  }

  // ✅ 1. جلب الوجبة + المطعم
  const meal = await this.mealRepo.findOne({
    where: { id: mealId },
    relations: ['restaurant'],
  });
  console.log('🍔 Meal from DB:', meal);

  if (!meal) {
    console.error('❌ Meal not found for ID:', mealId);
    throw new NotFoundException('Meal not found');
  }

  // ✅ 2. جلب أو إنشاء السلة
  let cart = await this.cartRepo.findOne({
    where: { userId },
    relations: ['items', 'items.meal', 'items.meal.restaurant'],
  });
  console.log('🛒 Cart before changes:', JSON.stringify(cart, null, 2));

  if (!cart) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      console.error('❌ User not found for ID:', userId);
      throw new NotFoundException('User not found');
    }

    cart = this.cartRepo.create({ userId, user, items: [] });
    cart = await this.cartRepo.save(cart);
    console.log('🆕 New cart created:', cart.id);
  }

  // ✅ 3. تحقق أن جميع العناصر من نفس المطعم
  if (cart.items.length > 0) {
    const existingRestaurantId = cart.items[0].meal.restaurant.id;
    console.log('🏷 Existing restaurant in cart:', existingRestaurantId);
    console.log('🏷 Incoming restaurant:', meal.restaurant.id);

    if (existingRestaurantId !== meal.restaurant.id) {
      console.error('❌ Different restaurant detected');
      throw new BadRequestException(
        'لا يمكنك الطلب من أكثر من مطعم في نفس السلة',
      );
    }
  }

  // ✅ 4. تحقق إذا العنصر موجود مسبقًا
  let item = await this.cartItemRepo.findOne({
    where: {
      cart: { id: cart.id },
      meal: { id: meal.id },
    },
    relations: ['meal', 'cart'],
  });
  console.log('🔍 Existing item in cart:', item);

  if (item) {
    item.quantity += quantity;
    await this.cartItemRepo.save(item);
    console.log('✏️ Updated item quantity:', item.quantity);
  } else {
    item = this.cartItemRepo.create({ meal, quantity, cart });
    await this.cartItemRepo.save(item);
    console.log('➕ New item added to cart:', item.id);
  }

  // ✅ 5. إرجاع JSON مرتب
  const result = await this.cartRepo
    .createQueryBuilder('cart')
    .leftJoinAndSelect('cart.items', 'items')
    .leftJoinAndSelect('items.meal', 'meal')
    .leftJoinAndSelect('meal.restaurant', 'restaurant')
    .select([
      'cart.id',
      'cart.userId',
      'items.id',
      'items.quantity',
      'meal.id',
      'meal.name',
      'meal.price',
      'meal.image_url',
      'restaurant.id',
      'restaurant.name',
      'restaurant.logo_url',
    ])
    .where('cart.id = :cartId', { cartId: cart.id })
    .getOneOrFail();

  console.log('✅ Final cart result:', JSON.stringify(result, null, 2));
  return result;
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
