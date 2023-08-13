import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // import prisma service
import { RedisService } from '../redis/redis.service'; // import redis service
// create interface for create store
interface CreateStore {
  name: string;
}

@Injectable()
export class StoreService {
  constructor(
    private readonly Prisma: PrismaService, // inject prisma service or create instance of prisma service
    private readonly redis: RedisService, // inject redis service or create instance of redis service
  ) {}
  // create store
  async createStore(data: CreateStore, userId: string) {
    try {
      const store = await this.Prisma.store.create({
        data: {
          name: data.name,
          userId: userId,
        },
        select: {
          id: true,
        },
      });
      Promise.all([
        this.redis.deleteValue('userFirstStore'),
        this.redis.deleteValue('stores'),
      ]);
      return store;
    } catch (error) {
      return 'Something went wrong';
    }
  }
  async getStoreById(id: string) {
    // get store from redisCache
    const storeFromRedis = await this.redis.getValueFromHash(id, 'store');
    if (storeFromRedis) return storeFromRedis;
    else {
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
      // set store to redisCache
      await this.redis.setValueToHash(id, 'store', JSON.stringify(store));
      return store;
    }
  }
  async getStoreByUserId(userId: string) {
    // get store from redisCache
    const storeFromRedis = await this.redis.getValueFromHash(
      'userFirstStore',
      'userStore',
    );
    if (storeFromRedis) return storeFromRedis;
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
    // set store to redisCache
    await this.redis.setValueToHash(
      'userFirstStore',
      'userStore',
      JSON.stringify(store),
    );
    return store;
  }

  async getAllStores(userId: string) {
    // get stores from redisCache
    const storesFromRedis = await this.redis.getValueFromList('stores');
    if (storesFromRedis && storesFromRedis.length !== 0) return storesFromRedis;
    else {
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
      if (!store.length) throw new NotFoundException('Stores not found');
      // set stores to redisCache
      await this.redis.setValueToList('stores', JSON.stringify(store));
      return store;
    }
  }

  async updateStore(id: string, data: CreateStore) {
    try {
      await this.Prisma.store.update({
        where: {
          id: id,
        },
        data: {
          name: data.name,
        },
      });
      // delete store from redisCache
      Promise.all([
        this.redis.deleteValue(id),
        this.redis.deleteValue('userFirstStore'),
        this.redis.deleteValue('stores'),
      ]);
      return 'Updated successfully';
    } catch (error) {
      return "Can't update store";
    }
  }
  async deleteStore(id: string) {
    try {
      await this.Prisma.store.delete({
        where: {
          id: id,
        },
      });
      // delete store from redisCache
      Promise.all([
        this.redis.deleteValue(id),
        this.redis.deleteValue('stores'),
      ]);
      return 'Deleted successfully';
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
