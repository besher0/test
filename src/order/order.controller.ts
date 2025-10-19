import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/dto.create.order';
import { User } from 'src/user/user.entity';

// type UserJwt = {
//   sub: string;
//   email?: string;
//   role?: string;
// };

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء طلب جديد' })
  @ApiBody({
    type: CreateOrderDto,
    examples: {
      delivery_example: {
        summary: 'Delivery order with address and schedule',
        value: {
          deliveryType: 'DELIVERY',
          latitude: 33.513805,
          longitude: 36.292934,
          address: 'دمشق - باب توما',
          notes: 'الرجاء الاتصال قبل الوصول',
          scheduledAt: '2025-10-20T18:30:00.000Z',
          items: [
            { mealId: 'meal-uuid-1', quantity: 2, note: 'بدون زيتون' },
            { mealId: 'meal-uuid-2', quantity: 1 },
          ],
        },
      },
      pickup_example: {
        summary: 'Pickup from location',
        value: {
          deliveryType: 'PICKUP_POINT',
          deliveryLocationId: 'location-uuid-123',
          notes: 'سآتي خلال 30 دقيقة',
          items: [{ mealId: 'meal-uuid-3', quantity: 1 }],
        },
      },
      from_cart_example: {
        summary: 'Create order from cart (no items in body)',
        value: {
          deliveryType: 'DELIVERY',
          latitude: 33.513805,
          longitude: 36.292934,
          address: 'دمشق - باب توما',
          notes: 'فضلاً طرق الباب برفق',
          clearCart: true,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Success' })
  createOrder(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get ()'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  getUserOrders(@CurrentUser() user: User) {
    return this.orderService.getOrders(user.id);
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current (active) orders for user',
  })
  @ApiResponse({ status: 200, description: 'Success' })
  getCurrent(@CurrentUser() user: User) {
    return this.orderService.getCurrentOrders(user.id);
  }

  @Get('previous')
  @ApiOperation({
    summary: 'Get previous (completed/cancelled) orders for user',
  })
  @ApiResponse({ status: 200, description: 'Success' })
  getPrevious(@CurrentUser() user: User) {
    return this.orderService.getPreviousOrders(user.id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: "Post (':id/status')".trim() })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELED'],
          example: 'CONFIRMED',
        },
      },
      required: ['status'],
    },
    examples: {
      confirm_then_capture: {
        summary: 'تأكيد الطلب (قد يلتقط الدفع تلقائياً لو مرتبط بـ PayPal)',
        value: { status: 'CONFIRMED' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Success' })
  updateStatus(@Param('id') orderId: string, @Body() body: { status: string }) {
    return this.orderService.updateStatus(orderId, body.status);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order by the current user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'I changed my mind' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  cancelOrder(
    @Param('id') orderId: string,
    @CurrentUser() user: User,
    @Body() body: { reason?: string },
  ) {
    return this.orderService.cancelOrder(user.id, orderId, body?.reason);
  }
}
