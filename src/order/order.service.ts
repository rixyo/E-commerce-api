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
      const orders = await this.prismaService.order.findMany({
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
  async getUserOrders(userId: string) {
    const cachedOrders = await this.redisService.getValueFromList(
      'user-orders',
    );
    if (cachedOrders && cachedOrders.length !== 0) return cachedOrders;
    else {
      const orders = await this.prismaService.order.findMany({
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
        'user-orders',
        JSON.stringify(orders),
      );
      return orders;
    }
  }
}
