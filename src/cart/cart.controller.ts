/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type UserJwt = {
  sub: string;
  email?: string;
  role?: string;
};

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get ()'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })  getCart(@CurrentUser() user: UserJwt) {
    return this.cartService.getUserCart(user.sub);
  }

  @Post('add')
    @ApiOperation({ summary: 'Post ("add")'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
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
  @ApiOperation({ summary: 'Delete (":itemId")'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  removeItem(@CurrentUser() user: UserJwt, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(user.sub, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete ()'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  clearCart(@CurrentUser() user: UserJwt) {
    return this.cartService.clearCart(user.sub);
  }
}
