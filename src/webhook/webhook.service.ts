import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import Stripe from 'stripe';
// this is the Stripe webhook service that will be used to handle Stripe events and update the database accordingly
@Injectable()
export class WebhookService {
  private stripe: Stripe;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
      typescript: true,
    });
  }
  async webhook(body: any, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.log(error);
      throw new Error(`Webhook error: ${error.message}`);
    }
    const session = event.data.object as Stripe.Checkout.Session;
    const address = session?.customer_details?.address;
    const addressComponents = [
      address?.line1,
      address?.line2,
      address?.city,
      address?.state,
      address?.postal_code,
      address?.country,
    ];
    const addressString = addressComponents
      .filter((c) => c !== null)
      .join(', ');
    if (event.type === 'checkout.session.completed') {
      const order = await this.prismaService.orders.update({
        where: {
          id: session?.metadata?.orderId,
        },
        data: {
          isPaid: true,
          address: addressString,
          phone: session?.customer_details?.phone || '',
        },
        include: {
          orderItems: true,
        },
      });
      await Promise.all([
        this.redisService.deleteValue('admin-orders'),
        this.redisService.deleteValue(order.id),
        this.redisService.deleteValue('pendding-orders'),
        this.redisService.deleteValue('delivered-orders'),
        this.redisService.deleteValue('total_revenue'),
        this.redisService.deleteValue('currentMonthRevenue'),
        this.redisService.deleteValue('previousMonthRevenue'),
      ]);
    }
    return { received: true };
  }
}
