import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
interface updateOrder {
  isDelivered: boolean;
  deliveredAt: string;
}
@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  // get all orders for a store
  async getAllOrders(storeId: string) {
    // get orders from redisCache
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
      // set orders to redisCache
      await this.redisService.setValueToList(
        'admin-orders',
        JSON.stringify(orders),
      );
      return orders;
    }
  }
  // get a single order by id
  async getOrderById(orderId: string) {
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
  // update order status
  async updateOrder(orderId: string, body: updateOrder) {
    await this.prismaService.orders.update({
      where: {
        id: orderId,
      },
      data: {
        isDelivered: body.isDelivered,
        deliveredAt: body.deliveredAt,
      },
    });
    // delete all orders from redisCache
    await Promise.all([
      this.redisService.deleteValue('admin-orders'),
      this.redisService.deleteValue(orderId),
      this.redisService.deleteValue('pendding-orders'),
      this.redisService.deleteValue('delivered-orders'),
      this.redisService.deleteValue('total_revenue'),
      this.redisService.deleteValue('currentMonthRevenue'),
      this.redisService.deleteValue('previousMonthRevenue'),
    ]);

    return 'order updated successfully';
  }
  // get all pendding orders for a user
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
  // get all delivered orders for a user
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
  async deleteOrder(orderId: string) {
    try {
      await this.prismaService.orderItem.deleteMany({
        where: {
          orderId: orderId,
        },
      }),
        await this.prismaService.orders.delete({
          where: {
            id: orderId,
          },
        });
    } catch (error) {
      throw new BadRequestException('Order not found');
    }
    // delete all orders from redisCache
    await Promise.all([
      this.redisService.deleteValue('admin-orders'),
      this.redisService.deleteValue(orderId),
      this.redisService.deleteValue('pendding-orders'),
      this.redisService.deleteValue('delivered-orders'),
      this.redisService.deleteValue('total_revenue'),
      this.redisService.deleteValue('currentMonthRevenue'),
      this.redisService.deleteValue('previousMonthRevenue'),
    ]);
    return 'order deleted successfully';
  }
}
