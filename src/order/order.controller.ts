import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

type UserJwt = {
  sub: string;
  email?: string;
  role?: string;
};

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Post ()'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  createOrder(@CurrentUser() user: UserJwt) {
    return this.orderService.createOrder(user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get ()'.trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  getUserOrders(@CurrentUser() user: UserJwt) {
    return this.orderService.getOrders(user.sub);
  }

  @Post(':id/status')
  @ApiOperation({ summary: "Post (':id/status')".trim() })
  @ApiResponse({ status: 200, description: 'Success' })
  updateStatus(@Param('id') orderId: string, @Body() body: { status: string }) {
    return this.orderService.updateStatus(orderId, body.status);
  }
}
