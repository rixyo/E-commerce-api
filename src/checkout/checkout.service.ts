import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
interface CreateCheckout {
  productIds: string[];
  quantity: number[];
}
@Injectable()
export class CheckoutService {
  private stripe: Stripe;
  constructor(private readonly prismaService: PrismaService) {
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
      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      products.forEach((product) => {
        line_items.push({
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
      const order = await this.prismaService.order.create({
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
              quantity: data.quantity[0],
            })),
          },
        },
      });
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
      return {
        id: session.id,
        url: session.url,
      };
    } catch (error) {
      console.log(error);
    }
  }
  // webhooks for stripe
  // but we need to verify the event
  async webhook(body: any, signature: string) {
    let event: Stripe.Event;
    const bodyString = JSON.stringify(body);

    try {
      event = this.verifyWebhookEvent(
        bodyString,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error: any) {
      console.log(error.message);
      return;
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
      await this.prismaService.order.update({
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
    }
    return { received: true };
  }
  verifyWebhookEvent(
    payload: any,
    sig: string,
    endpointSecret: string,
  ): Stripe.Event {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      sig,
      endpointSecret,
    );
    return event;
  }
}
