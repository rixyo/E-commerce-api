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
    try {
      const store = await this.Prisma.store.create({
        data: {
          name: data.name,
          userId: userId,
        },
      });
      await this.redis.setValue(`getAllStore+${userId}`, 'null');
      await this.redis.setValue(`findByUserId+${userId}`, 'null');
      return store;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
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
          name: true,
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
  async getAllStore(userId: string) {
    const storeFromCache = await this.redis.getValue(`getAllStore+${userId}`);
    if (storeFromCache === 'null' || !storeFromCache) {
      const store = await this.Prisma.store.findMany({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });
      if (!store) throw new NotFoundException('Store not found');
      await this.redis.setValue(`getAllStore+${userId}`, JSON.stringify(store));
      return store;
    }
    return JSON.parse(storeFromCache);
  }
  async updateStore(id: string, data: CreateStore) {
    try {
      const store = await this.Prisma.store.update({
        where: {
          id: id,
        },
        data: {
          name: data.name,
        },
      });
      await this.redis.setValue(id, 'null');
      await this.redis.setValue(`findByUserId+${store.userId}`, 'null');
      await this.redis.setValue(`getAllStore+${store.userId}`, 'null');
      return store;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  async deleteStore(id: string, userId: string) {
    try {
      await this.Prisma.store.delete({
        where: {
          id: id,
        },
      });
      await this.redis.deleteValue(id);
      await this.redis.deleteValue(`findByUserId+${userId}`);
      await this.redis.deleteValue(`getAllStore+${userId}`);
      return 'Deleted successfully';
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
