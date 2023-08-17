import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RevenueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}
  // get total revenue by storeId
  async getRevenueByStoreId(storeId: string) {
    const redisRevenue = await this.redis.getValueAsString('totalRevenue');
    if (redisRevenue) return JSON.parse(redisRevenue);
    const revenue = await this.prisma.orders.findMany({
      where: {
        storeId,
        isPaid: true,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                price: true,
              },
            },
          },
        },
      },
    });
    const totalRevenue = revenue.reduce((total, order) => {
      const orderTotal = order.orderItems.reduce((orderSum, item) => {
        return orderSum + item.product.price.toNumber();
      }, 0);
      return total + orderTotal;
    }, 0);
    await this.redis.setValueAsString(
      'totalRevenue',
      JSON.stringify(totalRevenue),
    );
    return totalRevenue;
  }
  // get revenue by storeId and date
  async getRevenueByStoreIdAndDate(storeId: string, date: Date) {
    const dateObject = new Date(date);
    const startDate = new Date(dateObject);
    const endDate = new Date(dateObject);
    endDate.setHours(23, 59, 59, 999);
    try {
      if (
        endDate.toString() === 'Invalid Date' ||
        startDate.toString() === 'Invalid Date'
      )
        return;
      const revenue = await this.prisma.orders.findMany({
        where: {
          storeId,
          isPaid: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  price: true,
                },
              },
            },
          },
        },
      });
      const totalRevenue = revenue.reduce((total, order) => {
        const orderTotal = order.orderItems.reduce((orderSum, item) => {
          return orderSum + item.product.price.toNumber();
        }, 0);
        return total + orderTotal;
      }, 0);
      return totalRevenue;
    } catch (error) {
      console.log(error);
    }
  }
  // get revenue by storeId and current month
  async getCurrentMontRevenue(storeId: string) {
    // Calculate the start and end dates of the specified month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 to get the correct month

    const startDate = new Date(currentYear, currentMonth - 1, 1); // Months are 0-indexed
    const endDate = new Date(currentYear, currentMonth, 0);
    endDate.setHours(23, 59, 59, 999);
    const cachedRevenue = await this.redis.getValueAsString(
      'currentMonthRevenue',
    );
    if (cachedRevenue) return JSON.parse(cachedRevenue);
    else {
      const revenue = await this.prisma.orders.findMany({
        where: {
          storeId,
          isPaid: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  price: true,
                },
              },
            },
          },
        },
      });
      const totalRevenue = revenue.reduce((total, order) => {
        const orderTotal = order.orderItems.reduce((orderSum, item) => {
          return orderSum + item.product.price.toNumber();
        }, 0);
        return total + orderTotal;
      }, 0);
      await this.redis.setValueAsString(
        'currentMonthRevenue',
        JSON.stringify(totalRevenue),
      );
      return totalRevenue;
    }
  }
  // get revenue by storeId and previous month
  async getPreviousMonthRevenue(storeId: string) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Get the first day of the previous month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    // Get the last day of the previous month
    const endDate = new Date(currentYear, currentMonth, 0);
    endDate.setHours(23, 59, 59, 999);

    const cachedRevenue = await this.redis.getValueAsString(
      'previousMonthRevenue',
    );
    if (cachedRevenue) return JSON.parse(cachedRevenue);
    else {
      const revenue = await this.prisma.orders.findMany({
        where: {
          storeId,
          isPaid: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  price: true,
                },
              },
            },
          },
        },
      });
      const totalRevenue = revenue.reduce((total, order) => {
        const orderTotal = order.orderItems.reduce((orderSum, item) => {
          return orderSum + item.product.price.toNumber();
        }, 0);
        return total + orderTotal;
      }, 0);
      await this.redis.setValueAsString(
        'previousMonthRevenue',
        JSON.stringify(totalRevenue),
      );

      return totalRevenue;
    }
  }
  async graphRevenue(storeId: string) {
    const paidOrders = await this.prisma.orders.findMany({
      where: {
        storeId,
        isPaid: true,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                price: true,
              },
            },
          },
        },
      },
    });
    const monthlyRevenue: { [key: number]: number } = {};

    // Grouping the orders by month and summing the revenue
    for (const order of paidOrders) {
      const month = order.createdAt.getMonth(); // 0 for Jan, 1 for Feb, ...
      let revenueForOrder = 0;

      for (const item of order.orderItems) {
        revenueForOrder += item.product.price.toNumber();
      }

      // Adding the revenue for this order to the respective month
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenueForOrder;
    }

    // Converting the grouped data into the format expected by the graph
    const graphData = [
      { name: 'Jan', total: 0 },
      { name: 'Feb', total: 0 },
      { name: 'Mar', total: 0 },
      { name: 'Apr', total: 0 },
      { name: 'May', total: 0 },
      { name: 'Jun', total: 0 },
      { name: 'Jul', total: 0 },
      { name: 'Aug', total: 0 },
      { name: 'Sep', total: 0 },
      { name: 'Oct', total: 0 },
      { name: 'Nov', total: 0 },
      { name: 'Dec', total: 0 },
    ];

    // Filling in the revenue data
    for (const month in monthlyRevenue) {
      graphData[parseInt(month)].total = monthlyRevenue[parseInt(month)];
    }

    return graphData;
  }
}
