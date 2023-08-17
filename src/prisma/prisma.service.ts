import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private isConnecting = false;

  async onModuleInit() {
    await this.$connect();
    console.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
  async cleanDatabase() {
    return this.$transaction([
      this.orderItem.deleteMany(),
      this.orders.deleteMany(),
      this.review.deleteMany(),
      this.product.deleteMany(),
      this.color.deleteMany(),
      this.user.deleteMany(),
      this.category.deleteMany(),
      this.size.deleteMany(),
      this.store.deleteMany(),
    ]);
  }
}
