/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';

type UserJwt = {
  sub: string;
  email?: string;
  role?: string;
};

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@CurrentUser() user: UserJwt) {
    return this.orderService.createOrder(user.sub);
  }

  @Get()
  getUserOrders(@CurrentUser() user: UserJwt) {
    return this.orderService.getOrders(user.sub);
  }

  @Post(':id/status')
  updateStatus(
    @Param('id') orderId: string,
    @Body() body: { status: string },
  ) {
    return this.orderService.updateStatus(orderId, body.status);
  }
}
