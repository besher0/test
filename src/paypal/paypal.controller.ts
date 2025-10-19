import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PayPalService } from './paypal.service';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        total: { type: 'string', example: '100.00' },
        currency: { type: 'string', example: 'USD', default: 'USD' },
        intent: {
          type: 'string',
          enum: ['CAPTURE', 'AUTHORIZE'],
          example: 'AUTHORIZE',
          default: 'CAPTURE',
        },
      },
      required: ['total'],
    },
    examples: {
      sandbox_example: {
        summary: 'Create 10 USD sandbox order',
        value: { total: '10.00', currency: 'USD', intent: 'CAPTURE' },
      },
    },
  })
  async createOrder(
    @Body('total') total: string,
    @Body('currency') currency?: string,
    @Body('intent') intent?: 'CAPTURE' | 'AUTHORIZE',
  ) {
    const amount = total || '100.00'; // قيمة افتراضية لو ما أرسل العميل
    return this.paypalService.createOrder(
      amount,
      currency || 'USD',
      intent || 'CAPTURE',
    );
  }

  // 🔹 تأكيد الدفع بعد موافقة العميل
  @Post('capture-order/:orderId')
  @ApiOperation({
    summary: 'Capture a standalone PayPal order by PayPal order id',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {},
    },
    examples: {
      capture_example: {
        summary: 'Capture example (no body needed)',
        value: {},
      },
    },
  })
  async captureOrder(@Param('orderId') orderId: string) {
    return this.paypalService.captureOrder(orderId);
  }

  // ربط الدفع بطلب داخلي
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('orders/:orderId/create')
  @ApiOperation({ summary: 'Create PayPal order linked to internal order id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          enum: ['CAPTURE', 'AUTHORIZE'],
          example: 'AUTHORIZE',
          default: 'CAPTURE',
        },
      },
    },
    examples: {
      linked_example: {
        summary: 'Create PayPal order for internal order with AUTHORIZE intent',
        value: { intent: 'AUTHORIZE' },
      },
    },
  })
  async createPaypalForOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
    @Body('intent') intent?: 'CAPTURE' | 'AUTHORIZE',
  ) {
    return this.paypalService.createPaypalForOrder(
      orderId,
      user.id,
      intent || 'CAPTURE',
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('orders/:orderId/capture')
  @ApiOperation({
    summary: 'Capture linked PayPal payment and update internal order',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {},
    },
    examples: {
      capture_linked_example: {
        summary: 'Capture linked order after approval (no body needed)',
        value: {},
      },
    },
  })
  async capturePaypalForOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ) {
    return this.paypalService.capturePaypalForOrder(orderId, user.id);
  }
}
