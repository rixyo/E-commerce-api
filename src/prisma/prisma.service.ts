import {
  Global,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Global()
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private isConnecting = false;
  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connect() {
    try {
      if (!this.isConnecting) {
        await this.$connect();
        this.isConnecting = true;
        console.log('Connected to the database.');
      }
    } catch (error) {
      this.isConnecting = false;
      console.error('Error connecting to the database:', error.message);
    }
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
