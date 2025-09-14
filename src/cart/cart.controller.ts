/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddToCartDto } from './dto/dto.createCart';

type UserJwt = {
  sub: string;
  email?: string;
  role?: string;
};

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
@ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the current user cart',
    schema: {
      example: {
        id: 'cart-123',
        userId: 'user-456',
        items: [
          { id: 'item-1', mealId: 'meal-789', quantity: 2, name: 'Pizza Margherita', price: 12.5 },
          { id: 'item-2', mealId: 'meal-101', quantity: 1, name: 'Spaghetti Carbonara', price: 15 },
        ],
        total: 40,
      }
    }
  })
   getCart(@CurrentUser() user: UserJwt) {
    return this.cartService.getUserCart(user.sub);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add an item to cart' })
  @ApiBody({ 
    type: AddToCartDto,
    examples: {
      default: {
        value: { mealId: 'meal-789', quantity: 2 }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Item added successfully',
    schema: {
      example: {
        id: 'item-1',
        mealId: 'meal-789',
        quantity: 2,
        name: 'Pizza Margherita',
        price: 12.5
      }
    }
  })
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
