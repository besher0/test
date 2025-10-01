import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddToCartDto } from './dto/dto.createCart';
import { User } from 'src/user/user.entity';
import { AddMultipleToCartDto } from './dto/add-multiple-to-cart.dto';

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
          {
            id: 'item-1',
            mealId: 'meal-789',
            quantity: 2,
            name: 'Pizza Margherita',
            price: 12.5,
          },
          {
            id: 'item-2',
            mealId: 'meal-101',
            quantity: 1,
            name: 'Spaghetti Carbonara',
            price: 15,
          },
        ],
        total: 40,
      },
    },
  })
  getCart(@CurrentUser() user: User) {
    return this.cartService.getUserCart(user.id);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add an item to cart' })
  @ApiBody({ type: AddToCartDto })
  async addItem(@CurrentUser() user: User, @Body() body: AddToCartDto) {
    const { mealId, quantity } = body;
    return this.cartService.addItem(user.id, mealId, quantity);
  }

  @Post('add-multiple')
  @ApiOperation({ summary: 'Add multiple items to cart' })
  @ApiBody({ type: AddMultipleToCartDto })
  async addMultipleItems(
    @CurrentUser() user: User,
    @Body() body: AddMultipleToCartDto,
  ) {
    return this.cartService.addMultipleItems(user.id, body.items);
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Delete (":itemId")'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  removeItem(@CurrentUser() user: User, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete ()'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  clearCart(@CurrentUser() user: User) {
    return this.cartService.clearCart(user.id);
  }
}
