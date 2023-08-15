import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SaleService {
  constructor(private readonly prisma: PrismaService) {}
  async getSalesByStore(storeId: string) {
    const totalSales = await this.prisma.orders.count({
      where: {
        storeId: storeId,
        isPaid: true,
      },
    });
    const totalSalesToday = await this.prisma.orders.count({
      where: {
        storeId: storeId,
        isPaid: true,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });
    const totalSalesThisMonth = await this.prisma.orders.count({
      where: {
        storeId: storeId,
        isPaid: true,
        createdAt: {
          gte: new Date(new Date().setDate(1)),
          lte: new Date(new Date().setDate(31)),
        },
      },
    });
    const totalSalesThisYear = await this.prisma.orders.count({
      where: {
        storeId: storeId,
        isPaid: true,
        createdAt: {
          gte: new Date(new Date().setMonth(0)),
          lte: new Date(new Date().setMonth(11)),
        },
      },
    });

    const totalSalesThisWeek = await this.prisma.orders.count({
      where: {
        storeId: storeId,
        isPaid: true,
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          lte: new Date(new Date().setDate(new Date().getDate() - 1)),
        },
      },
    });

    return {
      total_sale: totalSales,
      total_sale_today: totalSalesToday,
      total_sale_thisMonth: totalSalesThisMonth,
      total_sale_thisYear: totalSalesThisYear,
      total_sale_thisWeek: totalSalesThisWeek,
    };
  }
}
