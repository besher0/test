import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PayPalService } from './paypal.service';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';

@ApiTags('PayPal')
@Controller('paypal')
export class PayPalController {
  constructor(private readonly paypalService: PayPalService) {}

  // 🔹 إنشاء طلب دفع (client يرسل total)
  @Post('create-order')
  @ApiOperation({
    summary: 'Create a standalone PayPal order (not linked to internal order)',
  })
  async createOrder(@Body('total') total: string) {
    const amount = total || '100.00'; // قيمة افتراضية لو ما أرسل العميل
    return this.paypalService.createOrder(amount);
  }

  // 🔹 تأكيد الدفع بعد موافقة العميل
  @Post('capture-order/:orderId')
  @ApiOperation({
    summary: 'Capture a standalone PayPal order by PayPal order id',
  })
  async captureOrder(@Param('orderId') orderId: string) {
    return this.paypalService.captureOrder(orderId);
  }

  // ربط الدفع بطلب داخلي
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('orders/:orderId/create')
  @ApiOperation({ summary: 'Create PayPal order linked to internal order id' })
  async createPaypalForOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ) {
    return this.paypalService.createPaypalForOrder(orderId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('orders/:orderId/capture')
  @ApiOperation({
    summary: 'Capture linked PayPal payment and update internal order',
  })
  async capturePaypalForOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ) {
    return this.paypalService.capturePaypalForOrder(orderId, user.id);
  }
}
