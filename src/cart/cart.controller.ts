/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';

type UserJwt = {
  sub: string;
  email?: string;
  role?: string;
};

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: UserJwt) {
    return this.cartService.getUserCart(user.sub);
  }

  @Post('add')
  addItem(
    @CurrentUser() user: UserJwt,
    @Body() body: { mealId: string; quantity?: number },
  ) {
    return this.cartService.addItem(
      user.sub,
      body.mealId,
      body.quantity ?? 1,
    );
  }

  @Delete(':itemId')
  removeItem(@CurrentUser() user: UserJwt, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(user.sub, itemId);
  }

  @Delete()
  clearCart(@CurrentUser() user: UserJwt) {
    return this.cartService.clearCart(user.sub);
  }
}
