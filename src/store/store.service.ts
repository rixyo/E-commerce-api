import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

interface CreateStore {
  name: string;
}

@Injectable()
export class StoreService {
  constructor(
    private readonly Prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}
  async createStore(data: CreateStore, userId: string) {
    return await this.Prisma.store.create({
      data: {
        name: data.name,
        userId: userId,
      },
      select: {
        id: true,
      },
    });
  }
  async getStoreById(id: string) {
    const storeFromCache = await this.redis.getValue(id);
    if (!storeFromCache || storeFromCache === 'null') {
      const store = await this.Prisma.store.findFirst({
        where: {
          id: id,
        },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });
      if (!store) throw new NotFoundException('Store not found');
      await this.redis.setValue(id, JSON.stringify(store));
      return store;
    }
    return JSON.parse(storeFromCache);
  }
  async getStoreByUserId(userId: string) {
    const storeFromCache = await this.redis.getValue(`findByUserId+${userId}`);
    if (!storeFromCache || storeFromCache === 'null') {
      const store = await this.Prisma.store.findFirst({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          userId: true,
        },
      });
      if (!store) throw new NotFoundException('Store not found');
      await this.redis.setValue(
        `findByUserId+${userId}`,
        JSON.stringify(store),
      );
      return store;
    }
    return JSON.parse(storeFromCache);
  }
}
