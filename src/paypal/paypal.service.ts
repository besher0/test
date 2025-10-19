import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/order/order.entity';

type PaypalCreateOrderResponse = {
  id: string;
  status: string;
  links?: Array<{ href: string; rel: string; method: string }>;
};

type PaypalCaptureResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
      }>;
      authorizations?: Array<{
        id?: string;
        status?: string;
      }>;
    };
  }>;
};

type PaypalRefundResponse = {
  id?: string;
  status?: string;
  links?: Array<{ href?: string; rel?: string; method?: string }>;
};

@Injectable()
export class PayPalService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}
  private clientId = process.env.PAYPAL_CLIENT;
  private secret = process.env.PAYPAL_SECRET;
  private baseUrl =
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  private async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.secret) {
      throw new InternalServerErrorException('PayPal credentials are not set');
    }
    const auth = Buffer.from(`${this.clientId}:${this.secret}`).toString(
      'base64',
    );

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to get PayPal access token',
      );
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  async createOrder(
    total: string,
    currency = 'USD',
    intent: 'CAPTURE' | 'AUTHORIZE' = 'CAPTURE',
  ) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent,
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: total, // 🔹 القيمة المرسلة من الـ frontend أو ثابتة
            },
          },
        ],
        application_context: {
          return_url: process.env.PAYPAL_RETURN_URL || undefined,
          cancel_url: process.env.PAYPAL_CANCEL_URL || undefined,
        },
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to create PayPal order');
    }

    return (await response.json()) as PaypalCreateOrderResponse;
  }

  async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to capture PayPal order');
    }

    return (await response.json()) as PaypalCaptureResponse;
  }

  async authorizeOrder(orderId: string) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${orderId}/authorize`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to authorize PayPal order',
      );
    }

    return (await response.json()) as PaypalCaptureResponse;
  }

  async captureAuthorization(authorizationId: string) {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `${this.baseUrl}/v2/payments/authorizations/${authorizationId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
    if (!response.ok) {
      throw new InternalServerErrorException('Failed to capture authorization');
    }
    return (await response.json()) as PaypalCaptureResponse;
  }

  async voidAuthorization(authorizationId: string) {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `${this.baseUrl}/v2/payments/authorizations/${authorizationId}/void`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
    if (!response.ok) {
      throw new InternalServerErrorException('Failed to void authorization');
    }
    await response.json();
    return { success: true } as { success: boolean };
  }

  async refundCapture(captureId: string): Promise<PaypalRefundResponse> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
    if (!response.ok) {
      throw new InternalServerErrorException('Failed to refund capture');
    }
    return (await response.json()) as PaypalRefundResponse;
  }

  // إنشاء طلب PayPal مرتبط بطلب داخلي
  async createPaypalForOrder(
    orderId: string,
    userId?: string,
    intent: 'CAPTURE' | 'AUTHORIZE' = 'CAPTURE',
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (userId && String(order.user?.id) !== String(userId)) {
      throw new NotFoundException('Order not found for this user');
    }
    const amount = Number(order.totalPrice).toFixed(2);
    const created = await this.createOrder(amount, 'USD', intent);
    // حفظ ربط الطلب
    order.paymentStatus = 'PENDING';
    order.paypalOrderId = created.id;
    await this.orderRepo.save(order);

    // استخراج رابط الموافقة من الروابط إن وجد
    const approveLink = created.links?.find((l) => l.rel === 'approve')?.href;
    return { paypalOrder: created, approveLink } as {
      paypalOrder: PaypalCreateOrderResponse;
      approveLink?: string;
    };
  }

  // تأكيد الدفع وربطه بالطلب
  async capturePaypalForOrder(orderId: string, userId?: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (userId && String(order.user?.id) !== String(userId)) {
      throw new NotFoundException('Order not found for this user');
    }
    if (!order.paypalOrderId) {
      throw new InternalServerErrorException(
        'No PayPal order associated with this order',
      );
    }
    // لو كان الطلب مُنشأ بنية AUTHORIZE، نفذ authorization أولاً
    const captureOrAuth = await this.captureOrder(order.paypalOrderId).catch(
      async () => {
        // جرّب authorize إذا فشلت capture (لحالة intent=AUTHORIZE)
        return this.authorizeOrder(order.paypalOrderId!);
      },
    );

    const pu = captureOrAuth.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    const auth = pu?.payments?.authorizations?.[0];
    const captureId: string | undefined = cap?.id;
    const authorizationId: string | undefined = auth?.id;
    const status: string | undefined = captureOrAuth.status;

    if (authorizationId) {
      // صار Authorized لكن لم يُسحب المبلغ بعد
      order.paymentStatus = 'AUTHORIZED';
      order.paypalAuthorizationId = authorizationId;
      await this.orderRepo.save(order);
      return captureOrAuth;
    }

    if (status === 'COMPLETED' || status === 'APPROVED') {
      order.paymentStatus = 'PAID';
      order.status = 'CONFIRMED';
      order.paypalCaptureId = captureId ?? null;
    } else {
      order.paymentStatus = 'FAILED';
    }
    await this.orderRepo.save(order);
    return captureOrAuth;
  }

  async captureAuthorizedIfAny(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.paypalAuthorizationId) {
      throw new InternalServerErrorException('No PayPal authorization linked');
    }
    const captured = await this.captureAuthorization(
      order.paypalAuthorizationId,
    );
    const pu = captured.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    const captureId: string | undefined = cap?.id;
    const status: string | undefined = captured.status;
    if (status === 'COMPLETED' || status === 'APPROVED') {
      order.paymentStatus = 'PAID';
      order.status = 'CONFIRMED';
      order.paypalCaptureId = captureId ?? null;
      await this.orderRepo.save(order);
    }
    return captured;
  }
}
