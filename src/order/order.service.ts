import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async getAllOrders(storeId: string) {
    const cachedOrders = await this.redisService.getValueFromList(
      'admin-orders',
    );
    if (cachedOrders && cachedOrders.length !== 0) return cachedOrders;
    else {
      const orders = await this.prismaService.orders.findMany({
        where: {
          storeId: storeId,
        },
        select: {
          id: true,
          isPaid: true,
          isDelivered: true,
          deliveredAt: true,
          address: true,
          phone: true,
          createdAt: true,
          orderItems: {
            select: {
              id: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
              quantity: true,
              size: true,
              color: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (!orders) throw new NotFoundException('Orders not found');
      await this.redisService.setValueToList(
        'admin-orders',
        JSON.stringify(orders),
      );
      return orders;
    }
  }
  async getOrder(orderId: string) {
    const cachedOrder = await this.redisService.getValueFromHash(
      orderId,
      'order',
    );
    if (cachedOrder) return cachedOrder;
    else {
      const order = await this.prismaService.orders.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          isDelivered: true,
          deliveredAt: true,
        },
      });
      if (!order) throw new NotFoundException('Order not found');
      await this.redisService.setValueToHash(
        orderId,
        'order',
        JSON.stringify(order),
      );
      return order;
    }
  }
  async updateOrder(orderId: string, delivaryTime: Date, isDelivered: boolean) {
    await this.prismaService.orders.update({
      where: {
        id: orderId,
      },
      data: {
        isDelivered: isDelivered,
        deliveredAt: delivaryTime,
      },
    });
    await Promise.all([
      this.redisService.deleteValue('admin-orders'),
      this.redisService.deleteValue(orderId),
    ]);

    return 'order updated successfully';
  }
  async getUserPenddingOrders(userId: string) {
    const getPenddingOrders = await this.redisService.getValueFromList(
      'pendding-orders',
    );
    if (getPenddingOrders && getPenddingOrders.length !== 0)
      return getPenddingOrders;
    const orders = await this.prismaService.orders.findMany({
      where: {
        userId: userId,
        isDelivered: false,
      },
      select: {
        id: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            product: {
              select: {
                id: true,
                name: true,
                Images: {
                  select: {
                    url: true,
                  },
                  take: 1,
                },
              },
            },
            quantity: true,
            size: true,
            color: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (!orders) throw new NotFoundException('Orders not found');
    await this.redisService.setValueToList(
      'pendding-orders',
      JSON.stringify(orders),
    );

    return orders;
  }
  async getUserDeliveredOrders(userId: string) {
    const getDeliveredOrders = await this.redisService.getValueFromList(
      'delivered-orders',
    );
    if (getDeliveredOrders && getDeliveredOrders.length !== 0)
      return getDeliveredOrders;
    const orders = await this.prismaService.orders.findMany({
      where: {
        userId: userId,
        isDelivered: true,
      },
      select: {
        id: true,
        deliveredAt: true,
        orderItems: {
          select: {
            id: true,
            product: {
              select: {
                id: true,
                name: true,
                Images: {
                  select: {
                    url: true,
                  },
                  take: 1,
                },
              },
            },
            quantity: true,
            size: true,
            color: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (!orders) throw new NotFoundException('Orders not found');
    await this.redisService.setValueToList(
      'delivered-orders',
      JSON.stringify(orders),
    );

    return orders;
  }
}
