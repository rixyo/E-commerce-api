// Purpose: Checkout service for checkout module and stripe payment.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import Stripe from 'stripe';
interface CreateCheckout {
  productIds: string[];
  quantity: number[];
  size: string[];
  color: string[];
}
@Injectable()
export class CheckoutService {
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
  async createCheckout(data: CreateCheckout, userId: string, storeId: string) {
    try {
      const products = await this.prismaService.product.findMany({
        where: {
          id: {
            in: data.productIds,
          },
        },
      });
      if (products.length === 0) throw new Error('No product found');
      // create line items for stripe checkout
      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      products.forEach((product) => {
        line_items.push({
          // get quantity from data.quantity array by matching product id
          quantity: data.quantity.find(
            (quantity, index) => data.productIds[index] === product.id,
          ),
          price_data: {
            currency: 'BDT',
            product_data: {
              name: product.name,
            },
            unit_amount: product.price.toNumber() * 100,
          },
        });
      });
      const order = await this.prismaService.orders.create({
        data: {
          storeId: storeId,
          userId: userId,
          isDelivered: false,
          isPaid: false,
          orderItems: {
            create: data.productIds.map((productId: string) => ({
              product: {
                connect: {
                  id: productId,
                },
              },
              // get quantity from data.quantity array by matching product id and same for size and color
              quantity: data.quantity.find((quantity, index) => {
                return data.productIds[index] === productId;
              }),
              size: data.size.find((size, index) => {
                return data.productIds[index] === productId;
              }),
              color: data.color.find((color, index) => {
                return data.productIds[index] === productId;
              }),
            })),
          },
        },
      });
      // create stripe checkout session and return session id and url
      const session = await this.stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true,
        },
        success_url: `${process.env.DEV_CLIENT_URL}/cart?success=1`,
        cancel_url: `${process.env.DEV_CLIENT_URL}/cart?canceled=1`,
        metadata: {
          orderId: order.id,
        },
      });
      await Promise.all([
        this.redisService.deleteValue('admin-orders'),
        this.redisService.deleteValue('pendding-orders'),
        this.redisService.deleteValue('delivered-orders'),
        this.redisService.deleteValue('total_revenue'),
        this.redisService.deleteValue('currentMonthRevenue'),
        this.redisService.deleteValue('previousMonthRevenue'),
      ]);
      return {
        id: session.id,
        url: session.url,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
